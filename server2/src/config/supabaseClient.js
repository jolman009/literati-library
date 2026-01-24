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

const buildMockClient = () => {
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

export const supabase = isTest
  ? buildMockClient()
  : createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

export default supabase;
