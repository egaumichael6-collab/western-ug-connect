import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import { RequireAuth, RequireStaff, GuestOnly } from "./components/Guards";
import { Spinner } from "./components/ui";
import { ErrorPage } from "./pages/ErrorPages";
import Home from "./pages/Home";

type Mod = { default: ComponentType };
const preloaders: Array<() => Promise<unknown>> = [];

/**
 * A page that loads in the background ahead of time. Once its code is downloaded
 * it opens instantly (no loading spinner) when someone taps a link to it.
 */
function makePage(f: () => Promise<Mod>, preload: boolean) {
  let mod: Mod | undefined;
  let p: Promise<Mod> | undefined;
  const load = () => (p ??= f().then((m) => (mod = m)).catch((e) => { p = undefined; throw e; }));
  if (preload) preloaders.push(load);
  const Lazy = lazy(load);
  function Page() {
    const [ready] = useState(() => mod);
    if (ready) { const C = ready.default; return <C />; }
    return <Suspense fallback={<Spinner />}><Lazy /></Suspense>;
  }
  return <Page />;
}
const l = (f: () => Promise<Mod>) => makePage(f, true);
const la = (f: () => Promise<Mod>) => makePage(f, false); // admin pages: only staff need them

/** Download every page's code quietly after the first screen has loaded. */
function usePreloadPages() {
  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const run = () => { preloaders.reduce((chain, f) => chain.then(() => f().catch(() => undefined)), Promise.resolve() as Promise<unknown>); };
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 2500 });
    else setTimeout(run, 1200);
  }, []);
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: l(() => import("./pages/About")) },
      { path: "/memberships", element: l(() => import("./pages/Memberships")) },
      { path: "/safety", element: l(() => import("./pages/Safety")) },
      { path: "/contact", element: l(() => import("./pages/Contact")) },
      { path: "/faq", element: l(() => import("./pages/Faq")) },
      { path: "/privacy", element: l(() => import("./pages/legal/Privacy")) },
      { path: "/terms", element: l(() => import("./pages/legal/Terms")) },
      { path: "/guidelines", element: l(() => import("./pages/legal/Guidelines")) },
      { path: "/dating-in-uganda", element: l(() => import("./pages/DatingPages")) },
      { path: "/sugar-mummy-uganda", element: l(() => import("./pages/DatingPages").then((m) => ({ default: m.SugarMummyPage }))) },
      { path: "/sugar-daddy-uganda", element: l(() => import("./pages/DatingPages").then((m) => ({ default: m.SugarDaddyPage }))) },
      { path: "/dating/:slug", element: l(() => import("./pages/DatingPages").then((m) => ({ default: m.DatingTown }))) },
      { path: "/register", element: <GuestOnly>{l(() => import("./pages/auth/Register"))}</GuestOnly> },
      { path: "/login", element: <GuestOnly>{l(() => import("./pages/auth/Login"))}</GuestOnly> },
      { path: "/forgot-password", element: l(() => import("./pages/auth/ForgotPassword")) },
      { path: "/reset-password", element: l(() => import("./pages/auth/ResetPassword")) },
      {
        path: "/app",
        element: <RequireAuth />,
        children: [
          { path: "profile/edit", element: l(() => import("./pages/app/EditProfile")) },
          { path: "discover", element: l(() => import("./pages/app/Discover")) },
          { path: "recommendations", element: l(() => import("./pages/app/Recommendations")) },
          { path: "likes", element: l(() => import("./pages/app/Likes")) },
          { path: "matches", element: l(() => import("./pages/app/Matches")) },
          { path: "messages", element: l(() => import("./pages/app/Messages")) },
          { path: "messages/:conversationId", element: l(() => import("./pages/app/Messages")) },
          { path: "members/:id", element: l(() => import("./pages/app/MemberProfile")) },
          { path: "checkout/:code", element: l(() => import("./pages/app/SubmitPayment")) },
          { path: "pay/:code", element: l(() => import("./pages/app/SubmitPayment")) },
          { path: "subscription", element: l(() => import("./pages/app/MySubscription")) },
          { path: "payments", element: l(() => import("./pages/app/PaymentHistory")) },
          { path: "settings", element: l(() => import("./pages/app/Settings")) },
          { path: "notifications", element: l(() => import("./pages/app/Notifications")) },
        ],
      },
      { path: "/admin/login", element: la(() => import("./pages/admin/AdminLogin")) },
      {
        path: "/admin",
        element: <RequireStaff />,
        children: [
          { index: true, element: la(() => import("./pages/admin/AdminDashboard")) },
          { path: "payments", element: la(() => import("./pages/admin/AdminPayments")) },
          { path: "members", element: la(() => import("./pages/admin/AdminMembers")) },
          { path: "memberships", element: la(() => import("./pages/admin/AdminMemberships")) },
        ],
      },
      { path: "*", element: l(() => import("./pages/ErrorPages").then((m) => ({ default: m.NotFound }))) },
    ],
  },
]);

export default function App() {
  usePreloadPages();
  return <RouterProvider router={router} />;
}
