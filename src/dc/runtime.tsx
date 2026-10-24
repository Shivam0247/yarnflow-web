/**
 * Tiny runtime shared by every screen.
 *  - DCLogic : base class for screen logic (a plain React class component)
 *  - useTheme: 'dark' | 'light' (follows the OS setting)
 *  - DcLink  : turns design links ("SalesOrderList.dc.html") into app routes
 *  - sx      : turns a CSS string into a React style object
 */
import { Component, useSyncExternalStore, type AnchorHTMLAttributes, type CSSProperties, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes';

/* ---------- DCLogic ---------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DCLogic<P = any, S = any> extends Component<P, S> {}

/* ---------- theme ---------- */
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null;
const subscribe = (cb: () => void) => {
  mq?.addEventListener('change', cb);
  window.addEventListener('storage', cb);
  return () => {
    mq?.removeEventListener('change', cb);
    window.removeEventListener('storage', cb);
  };
};
const snapshot = (): 'dark' | 'light' => {
  try {
    const forced = window.localStorage.getItem('yf-theme');
    if (forced === 'dark' || forced === 'light') return forced;
  } catch {
    /* storage blocked */
  }
  return mq?.matches ? 'light' : 'dark';
};
export const useTheme = () => useSyncExternalStore(subscribe, snapshot, () => 'dark' as const);

/* ---------- links ---------- */
/** "SalesOrderListLight.dc.html#ai" → "/sales/orders#ai" */
export function resolveHref(href: string | undefined): string | null {
  if (!href || href === '#' || /^(https?:|mailto:|tel:)/.test(href)) return null;
  const m = /^([A-Za-z]+)\.dc\.html(#.*)?$/.exec(href);
  if (!m) return null;
  let name = m[1];
  if (!ROUTES[name] && name.endsWith('Light')) name = name.slice(0, -5);
  const path = ROUTES[name];
  return path ? path + (m[2] ?? '') : null;
}

export function DcLink({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const nav = useNavigate();
  const to = resolveHref(href);
  if (!to) return <a href={href} onClick={onClick} {...rest} />;
  return (
    <a
      href={to}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        nav(to);
      }}
      {...rest}
    />
  );
}

/* ---------- style strings ---------- */
const cache = new Map<string, CSSProperties>();
export function sx(s: string | undefined | null): CSSProperties | undefined {
  if (!s) return undefined;
  let o = cache.get(s);
  if (o) return o;
  const out: Record<string, string> = {};
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    if (!k) continue;
    const key = k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = decl.slice(i + 1).trim();
  }
  o = out as CSSProperties;
  cache.set(s, o);
  return o;
}
