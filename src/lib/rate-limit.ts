/**
 * In-memory login throttle: locks an account after repeated failures.
 *
 * NOTE: this is per-process. On a single server (or low-traffic Vercel) it's a
 * meaningful brute-force speed bump. For multi-instance production, back it with
 * a shared store (Upstash/Redis) — the interface here is intentionally small so
 * it can be swapped without touching callers.
 */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface Entry {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

const store = new Map<string, Entry>();

function now(): number {
  return Date.now();
}

/** True if the key is currently locked out. */
export function isLockedOut(key: string): boolean {
  const e = store.get(key);
  if (!e) return false;
  if (e.lockedUntil && e.lockedUntil > now()) return true;
  // Lock expired — clear it.
  if (e.lockedUntil && e.lockedUntil <= now()) {
    store.delete(key);
    return false;
  }
  return false;
}

/** Record a failed attempt; locks the key once failures exceed the threshold. */
export function recordFailure(key: string): void {
  const t = now();
  const e = store.get(key);
  if (!e || t - e.firstFailureAt > WINDOW_MS) {
    store.set(key, { failures: 1, firstFailureAt: t, lockedUntil: 0 });
    return;
  }
  e.failures += 1;
  if (e.failures >= MAX_FAILURES) {
    e.lockedUntil = t + LOCKOUT_MS;
  }
  store.set(key, e);
}

/** Clear state on a successful login. */
export function recordSuccess(key: string): void {
  store.delete(key);
}
