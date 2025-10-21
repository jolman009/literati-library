import { describe, it, expect } from 'vitest';
import { BOOK_STATUS, getStatus, applyStatus, normalizeStatus, isStatus, compareByStatus, STATUS_ORDER_DEFAULT } from '../bookStatus';

const mkBook = (overrides = {}) => ({ id: 'b1', title: 'Alpha', progress: 0, ...overrides });

describe('bookStatus model', () => {
  it('defaults to unread', () => {
    expect(getStatus(mkBook())).toBe(BOOK_STATUS.UNREAD);
  });

  it('completed when completed flag true or status completed', () => {
    expect(getStatus(mkBook({ completed: true }))).toBe(BOOK_STATUS.COMPLETED);
    expect(getStatus(mkBook({ status: 'completed' }))).toBe(BOOK_STATUS.COMPLETED);
  });

  it('reading when is_reading true or status reading', () => {
    expect(getStatus(mkBook({ is_reading: true }))).toBe(BOOK_STATUS.READING);
    expect(getStatus(mkBook({ isReading: true }))).toBe(BOOK_STATUS.READING);
    expect(getStatus(mkBook({ status: 'reading' }))).toBe(BOOK_STATUS.READING);
  });

  it('reading when active session for the book and not paused', () => {
    const book = mkBook({ id: 'X' });
    const session = { activeSession: { book: { id: 'X' } }, isPaused: false };
    expect(getStatus(book, session)).toBe(BOOK_STATUS.READING);
  });

  it('paused when progress between 1 and 99', () => {
    expect(getStatus(mkBook({ progress: 1 }))).toBe(BOOK_STATUS.PAUSED);
    expect(getStatus(mkBook({ progress: 42 }))).toBe(BOOK_STATUS.PAUSED);
    expect(getStatus(mkBook({ progress: 99 }))).toBe(BOOK_STATUS.PAUSED);
  });

  it('applyStatus sets flags and fields consistently', () => {
    const base = mkBook();
    let b = applyStatus(base, BOOK_STATUS.READING);
    expect(b.status).toBe(BOOK_STATUS.READING);
    expect(b.is_reading).toBe(true);
    expect(b.completed).toBe(false);
    expect(Number(b.progress)).toBeGreaterThan(0);

    b = applyStatus(base, BOOK_STATUS.PAUSED);
    expect(b.status).toBe(BOOK_STATUS.PAUSED);
    expect(b.is_reading).toBe(false);
    expect(b.completed).toBe(false);
    expect(Number(b.progress)).toBeGreaterThan(0);
    expect(Number(b.progress)).toBeLessThan(100);

    b = applyStatus(base, BOOK_STATUS.COMPLETED);
    expect(b.status).toBe(BOOK_STATUS.COMPLETED);
    expect(b.is_reading).toBe(false);
    expect(b.completed).toBe(true);
    expect(b.progress).toBe(100);

    b = applyStatus(base, BOOK_STATUS.UNREAD);
    expect(b.status).toBe(BOOK_STATUS.UNREAD);
    expect(b.is_reading).toBe(false);
    expect(b.completed).toBe(false);
    expect(b.progress).toBe(0);
  });

  it('normalizeStatus maps variants', () => {
    expect(normalizeStatus('in_progress')).toBe(BOOK_STATUS.READING);
    expect(normalizeStatus('Started Reading')).toBe(BOOK_STATUS.READING);
    expect(normalizeStatus('unknown')).toBe(BOOK_STATUS.UNREAD);
  });

  it('isStatus works with session context', () => {
    const book = mkBook({ id: 'B' });
    const session = { activeSession: { book: { id: 'B' } }, isPaused: false };
    expect(isStatus(book, 'reading', session)).toBe(true);
  });

  it('compareByStatus sorts by status rank, then progress desc, then title', () => {
    const books = [
      mkBook({ id: '1', title: 'Zeta', status: 'completed', progress: 100 }),
      mkBook({ id: '2', title: 'Alpha', is_reading: true, progress: 15 }),
      mkBook({ id: '3', title: 'Beta', progress: 20 }),
      mkBook({ id: '4', title: 'Gamma', progress: 5 }),
    ];
    const sorted = [...books].sort((a,b) => compareByStatus(a,b,{}));
    // Expected order: reading -> paused (20) -> paused (5) -> unread/completed based on default (unread before completed)
    expect(sorted[0].id).toBe('2'); // reading first
    expect(sorted[1].id).toBe('3'); // paused 20
    expect(sorted[2].id).toBe('4'); // paused 5
  });
});

