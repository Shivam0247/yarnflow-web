import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router-dom';
import { YF_API, loading } from '@/dc/api';
import './loading.css';
import { PAGES } from '@/app/routes';
import { resolveHref } from '@/dc/runtime';

const PrintPage = lazy(() => import('@/print/PrintPage'));
const ReportPage = lazy(() => import('@/print/ReportPage'));
const OutstandingPrint = lazy(() => import('@/print/OutstandingPrint'));
const GridPrint = lazy(() => import('@/print/GridPrint'));

/** Each screen is a full page (sidebar + content + assistant), exactly as in the design. */
function Root() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const session = useSyncExternalStore(YF_API.subscribe, () => YF_API.session);
  useEffect(() => YF_API.setNavigator((to) => nav(to)), [nav]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  // Screen logic sometimes navigates by clicking a hidden <a href="X.dc.html">;
  // route those clicks through the router as well.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a');
      const to = a && resolveHref(a.getAttribute('href') ?? undefined);
      if (!to || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      nav(to);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [nav]);
  // signed-out users only see the sign-in screen
  if (!session && pathname !== '/login') return <Navigate to="/login" replace />;
  if (session?.choosing && pathname !== '/login') return <Navigate to="/login" replace />;
  if (session && !session.choosing && pathname === '/login') return <Navigate to="/" replace />;
  return (
    <>
      <LoadingBar />
      <Suspense fallback={<ScreenSpinner />}>
        <Outlet />
      </Suspense>
    </>
  );
}

/** thin moving bar at the top + a small label while YarnFlow waits for the server (shown after 200 ms, so quick answers don't flicker) */
function LoadingBar() {
  const n = useSyncExternalStore(loading.subscribe, loading.get);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!n) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, [n > 0]);
  if (!show) return null;
  return (
    <div role="status" aria-live="polite" className="yf-loadbar">
      <div className="yf-loadbar-track"><div className="yf-loadbar-run" /></div>
      <div className="yf-loadbar-label"><span className="yf-loadbar-dot" />Loading…</div>
    </div>
  );
}
/** while a screen's code is being opened */
function ScreenSpinner() {
  return (
    <div className="yf-screen-spin" role="status" aria-live="polite">
      <span className="yf-spin" />
      <span>Opening…</span>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      ...PAGES.map(({ path, Component }) => ({ path, element: <Component /> })),
      { path: '/print/outstanding', element: <OutstandingPrint /> },
      { path: '/print/grid/:kind', element: <GridPrint /> },
      { path: '/print/report/:regId', element: <ReportPage /> },
      { path: '/print/:slug/:id', element: <PrintPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

// match the page background to the saved / system theme before first paint
try {
  const t = localStorage.getItem('yf-theme') ?? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.body.style.background = t === 'light' ? '#FFFFFF' : '#141414';
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
