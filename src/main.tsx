import { Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router-dom';
import { PAGES } from '@/app/routes';
import { resolveHref } from '@/dc/runtime';

/** Each screen is a full page (sidebar + content + assistant), exactly as in the design. */
function Root() {
  const { pathname } = useLocation();
  const nav = useNavigate();
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
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      ...PAGES.map(({ path, Component }) => ({ path, element: <Component /> })),
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
);
