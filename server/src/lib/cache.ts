/**
 * Small in-memory cache for results that are slow to compute on the full data.
 * Every save (any write request) moves the version on, so nothing stale is served after a change
 * (results marked `masters` move on only when a master changes) —
 * except where `swr` is asked for: then the last answer is returned at once and a fresh one is worked out
 * in the background (used for the dashboard and the assistant's insights).
 */
let ver = 0;
/** masters (parties, brokers, items, books…) change far less often than documents: they get their own version */
let mver = 0;
/** differs per server start, so a version remembered by a browser never matches a different run */
const boot = Date.now().toString(36);
export const bump = (masters = true) => { ver++; if (masters) mver++; };
/** version of the master lists, sent to the browser so it re-downloads them only when they changed */
export const mastersVersion = () => boot + '.' + mver;
interface Rec { at: number; ver: number; p: Promise<unknown>; val?: unknown; has: boolean; busy: boolean }
const store = new Map<string, Rec>();
export function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>, opts: { swr?: boolean; masters?: boolean } = {}): Promise<T> {
  // a result built only from masters stays valid until a master changes (documents being saved do not touch it)
  const cur = () => (opts.masters ? mver : ver);
  const now = cur();
  const e = store.get(key);
  const fresh = e && e.ver === now && Date.now() - e.at < ttlMs;
  if (e && fresh) return e.p as Promise<T>;
  if (e && opts.swr && e.has) {
    if (!e.busy) {
      e.busy = true;
      const v0 = cur();
      fn().then((v) => store.set(key, { at: Date.now(), ver: v0, p: Promise.resolve(v), val: v, has: true, busy: false }))
        .catch(() => { e.busy = false; });
    }
    return Promise.resolve(e.val as T);
  }
  const rec: Rec = { at: Date.now(), ver: now, p: fn(), has: false, busy: false };
  store.set(key, rec);
  rec.p.then((v) => { rec.val = v; rec.has = true; }).catch(() => { if (store.get(key) === rec) store.delete(key); });
  return rec.p as Promise<T>;
}
