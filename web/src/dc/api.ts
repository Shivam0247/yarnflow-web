/**
 * YF_API — the live data layer for every screen.
 *
 * Screen logic (written in the design files) checks `window.YF_API`:
 *   present → load / save through the backend
 *   absent  → use the design's sample data (the design canvas)
 * so the same screen code runs in the design and in the app.
 */
export interface Fy { id: number; label: string; startDate: string; endDate: string; isLocked: boolean }
export interface Company { id: number; name: string; shortName: string | null; gstin: string | null; city: string | null; stateCode: string; financialYears: Fy[] }
export interface User { id: number; name: string; email: string; role: string; companies: Company[] }
interface Session { token: string; user: User; companyId: number; fyId: number }

const KEY = 'yf-session';
const listeners = new Set<() => void>();
let session: Session | null = load();
let navigate: ((to: string) => void) | null = null;
const cache = new Map<string, Promise<unknown>>();

function load(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
function save(s: Session | null) {
  session = s;
  cache.clear();
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  listeners.forEach((f) => f());
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

async function request<T = any>(method: string, path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])).toString() : '';
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (session) {
    headers.authorization = 'Bearer ' + session.token;
    headers['x-company-id'] = String(session.companyId);
    headers['x-fy-id'] = String(session.fyId);
  }
  const res = await fetch('/api' + path + (qs.length > 1 ? qs : ''), { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (res.status === 401 && session) {
    save(null);
    navigate?.('/login');
  }
  if (!res.ok) throw new ApiError(res.status, data?.error?.message ?? res.statusText, data);
  return data as T;
}

const z = (n: number) => String(n).padStart(2, '0');

export const YF_API = {
  isLive: true as const,
  get session() {
    return session;
  },
  get user() {
    return session?.user ?? null;
  },
  get company() {
    return session?.user.companies.find((c) => c.id === session!.companyId) ?? null;
  },
  get fy() {
    return this.company?.financialYears.find((f) => f.id === session!.fyId) ?? null;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  setNavigator(fn: (to: string) => void) {
    navigate = fn;
  },
  go(to: string) {
    navigate?.(to);
  },

  async login(email: string, password: string) {
    const r = await request<{ token: string; user: User }>('POST', '/auth/login', { email, password });
    const c = r.user.companies[0];
    if (!c) throw new ApiError(403, 'No company is assigned to this user yet');
    save({ token: r.token, user: r.user, companyId: c.id, fyId: c.financialYears[0]?.id });
    return session;
  },
  logout() {
    save(null);
    navigate?.('/login');
  },
  async refreshProfile() {
    if (!session) return;
    const user = await request<User>('GET', '/auth/me');
    save({ ...session, user });
  },
  switchCompany(companyId: number, fyId?: number) {
    if (!session) return;
    const c = session.user.companies.find((x) => x.id === companyId);
    if (!c) return;
    save({ ...session, companyId, fyId: fyId ?? c.financialYears[0]?.id });
  },

  get: <T = any>(path: string, query?: Record<string, unknown>) => request<T>('GET', path, undefined, query),
  post: <T = any>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T = any>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T = any>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T = any>(path: string) => request<T>('DELETE', path),

  /** dropdown data for entry forms (cached per company until a save) */
  lookups(force = false) {
    const k = 'lookups:' + session?.companyId;
    if (force || !cache.has(k)) cache.set(k, request('GET', '/lookups'));
    return cache.get(k) as Promise<any>;
  },
  invalidate() {
    cache.clear();
  },

  /* formatting shared by screens */
  /** '2026-10-23' → '23-10-2026' */
  dmy(iso?: string | null) {
    if (!iso) return '';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  },
  /** '23-10-2026' → '2026-10-23' (also accepts ISO) */
  iso(dmy?: string | null) {
    if (!dmy) return '';
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy.trim());
    return m ? `${m[3]}-${m[2]}-${m[1]}` : dmy.slice(0, 10);
  },
  today() {
    const t = new Date();
    return `${t.getFullYear()}-${z(t.getMonth() + 1)}-${z(t.getDate())}`;
  },
  inr(n: number | string | null | undefined, d = 2) {
    const v = Number(n ?? 0);
    const s = Math.abs(v).toFixed(d);
    const [i, f] = s.split('.');
    let l3 = i.slice(-3);
    const rest = i.slice(0, -3);
    if (rest) l3 = ',' + l3;
    return (v < 0 ? '-' : '') + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + l3 + (f ? '.' + f : '');
  },
  /** short message for an error thrown by a request */
  message(e: unknown) {
    return e instanceof Error ? e.message : String(e);
  }
};

declare global {
  interface Window {
    YF_API?: typeof YF_API;
  }
}
window.YF_API = YF_API;
