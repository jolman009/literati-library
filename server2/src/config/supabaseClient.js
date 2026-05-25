import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const isTest = process.env.NODE_ENV === "test";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";

// Only enforce env validation outside of tests to avoid noisy CI/unit errors
if (!isTest) {
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not set in environment variables");
  }
  if (!supabaseKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY is not set in environment variables"
    );
  }
}

const wrapWithJest = (fn) =>
  typeof jest !== "undefined" ? jest.fn(fn) : fn;

// ============================================================================
// Simple per-call mock — used by Jest unit tests
// ----------------------------------------------------------------------------
// Methods return Promises resolving to {data: null, ...}. Unit tests
// typically jest.mock() at the test level, so chain semantics don't matter;
// this baseline mock just needs to be a non-throwing stand-in. Keeping this
// behavior preserves backward compatibility with existing unit-test suites
// that assert on `data: null` returns.
// ============================================================================
const buildSimpleMockClient = () => {
  const createQueryBuilder = () => {
    const ok = () =>
      Promise.resolve({
        data: null,
        error: null,
        status: 200,
        statusText: "OK",
      });

    const qb = {
      select: wrapWithJest(ok),
      insert: wrapWithJest(ok),
      update: wrapWithJest(ok),
      delete: wrapWithJest(ok),
      upsert: wrapWithJest(ok),
      single: wrapWithJest(ok),
      eq: wrapWithJest(() => qb),
      order: wrapWithJest(() => qb),
      range: wrapWithJest(() => qb),
    };

    return qb;
  };

  const createStorageClient = () => {
    const ok = () =>
      Promise.resolve({
        data: null,
        error: null,
        status: 200,
        statusText: "OK",
      });

    return {
      upload: wrapWithJest(ok),
      remove: wrapWithJest(ok),
      getPublicUrl: wrapWithJest(() => ({
        data: { publicUrl: "" },
        error: null,
      })),
    };
  };

  const authOk = () =>
    Promise.resolve({
      data: null,
      error: null,
      status: 200,
      statusText: "OK",
    });

  return {
    auth: {
      getUser: wrapWithJest(authOk),
      signInWithPassword: wrapWithJest(authOk),
      signUp: wrapWithJest(authOk),
      signOut: wrapWithJest(authOk),
    },
    from: wrapWithJest(() => createQueryBuilder()),
    storage: {
      from: wrapWithJest(() => createStorageClient()),
    },
  };
};

// ============================================================================
// Stateful in-memory mock — used by E2E tests
// ----------------------------------------------------------------------------
// Playwright spawns the server in a subprocess where Jest is not defined.
// Real route handlers chain `.from().select().eq().single()` and expect
// realistic data back (e.g. registration inserts a user, then login reads it).
// The simple mock above can't satisfy that — its `select()` returns a Promise
// rather than a chainable builder (TypeError: ...eq is not a function), and
// it has no memory of inserted rows.
//
// This stateful mock provides a tiny in-memory store keyed by table name and
// supports basic CRUD with chained .eq()/.in()/.is() filters and
// .single()/.maybeSingle() projections. State lives for the lifetime of the
// server process — fresh on every CI run, persistent across requests within
// a run (exactly what E2E needs).
//
// Not a full Supabase replacement: no joins, no ordering precision, no
// column projection, no RLS. Add functionality as new test scenarios demand.
// ============================================================================
const buildStatefulMockClient = () => {
  const store = new Map(); // tableName -> Array<row>
  let nextId = 1;

  const getTable = (tableName) => {
    if (!store.has(tableName)) store.set(tableName, []);
    return store.get(tableName);
  };

  const createQueryBuilder = (tableName) => {
    const filters = []; // [column, operator, value]
    let pendingInsert = null;
    let pendingUpdate = null;
    let isDelete = false;
    let returnSingle = false;

    const matches = (row) =>
      filters.every(([col, op, val]) => {
        if (op === "eq") return row[col] === val;
        if (op === "neq") return row[col] !== val;
        if (op === "in") return Array.isArray(val) && val.includes(row[col]);
        if (op === "is") return row[col] === val;
        if (op === "gt") return row[col] > val;
        if (op === "gte") return row[col] >= val;
        if (op === "lt") return row[col] < val;
        if (op === "lte") return row[col] <= val;
        return true;
      });

    const qb = {
      select: () => qb,
      insert: (payload) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        pendingInsert = rows.map((r) => ({ id: `mock-${nextId++}`, ...r }));
        return qb;
      },
      update: (payload) => {
        pendingUpdate = payload;
        return qb;
      },
      upsert: (payload) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        pendingInsert = rows.map((r) => ({
          id: r.id || `mock-${nextId++}`,
          ...r,
        }));
        return qb;
      },
      delete: () => {
        isDelete = true;
        return qb;
      },
      eq: (col, val) => {
        filters.push([col, "eq", val]);
        return qb;
      },
      neq: (col, val) => {
        filters.push([col, "neq", val]);
        return qb;
      },
      in: (col, vals) => {
        filters.push([col, "in", vals]);
        return qb;
      },
      is: (col, val) => {
        filters.push([col, "is", val]);
        return qb;
      },
      gt: (col, val) => {
        filters.push([col, "gt", val]);
        return qb;
      },
      gte: (col, val) => {
        filters.push([col, "gte", val]);
        return qb;
      },
      lt: (col, val) => {
        filters.push([col, "lt", val]);
        return qb;
      },
      lte: (col, val) => {
        filters.push([col, "lte", val]);
        return qb;
      },
      order: () => qb,
      limit: () => qb,
      range: () => qb,
      single: () => {
        returnSingle = true;
        return qb;
      },
      maybeSingle: () => {
        returnSingle = true;
        return qb;
      },
      then: (onFulfilled, onRejected) => {
        const table = getTable(tableName);
        let data;
        let error = null;

        try {
          if (pendingInsert) {
            // INSERT: append, return inserted rows
            table.push(...pendingInsert);
            data = returnSingle ? pendingInsert[0] : pendingInsert;
          } else if (pendingUpdate) {
            // UPDATE: mutate matching rows in place
            const updated = [];
            for (const row of table) {
              if (matches(row)) {
                Object.assign(row, pendingUpdate);
                updated.push(row);
              }
            }
            data = returnSingle ? updated[0] || null : updated;
          } else if (isDelete) {
            // DELETE: drop matching rows
            const remaining = table.filter((row) => !matches(row));
            store.set(tableName, remaining);
            data = null;
          } else {
            // SELECT: filter (no column projection — return full row)
            const matching = table.filter(matches);
            data = returnSingle ? matching[0] || null : matching;
          }
        } catch (e) {
          error = { message: e.message, details: e.stack };
        }

        return Promise.resolve({
          data,
          error,
          status: 200,
          statusText: "OK",
        }).then(onFulfilled, onRejected);
      },
      catch: function (onRejected) {
        return qb.then(undefined, onRejected);
      },
      finally: function (onFinally) {
        return qb.then(
          (value) => Promise.resolve(onFinally()).then(() => value),
          (reason) =>
            Promise.resolve(onFinally()).then(() => Promise.reject(reason))
        );
      },
    };

    return qb;
  };

  const createStorageClient = () => ({
    upload: () =>
      Promise.resolve({
        data: { path: "mock-path" },
        error: null,
        status: 200,
        statusText: "OK",
      }),
    remove: () =>
      Promise.resolve({
        data: null,
        error: null,
        status: 200,
        statusText: "OK",
      }),
    getPublicUrl: () => ({ data: { publicUrl: "" }, error: null }),
  });

  return {
    auth: {
      getUser: () => Promise.resolve({ data: null, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ data: null, error: null }),
    },
    from: (tableName) => createQueryBuilder(tableName),
    storage: {
      from: () => createStorageClient(),
    },
  };
};

// Mode selection:
//   - Production / dev:        real Supabase client
//   - Jest unit tests:         simple mock (preserves existing behavior)
//   - E2E (server subprocess): stateful mock (new — supports realistic
//                              register -> login -> query round-trips)
const useStatefulMock = isTest && typeof jest === "undefined";

export const supabase = isTest
  ? useStatefulMock
    ? buildStatefulMockClient()
    : buildSimpleMockClient()
  : createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

export default supabase;
