import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import { RequireAuth, RequireStaff, GuestOnly } from "./components/Guards";
import { Spinner } from "./components/ui";
import { ErrorPage } from "./pages/ErrorPages";
import Home from "./pages/Home";

const l = (f: () => Promise<{ default: ComponentType }>) => {
  const C = lazy(f);
  return <Suspense fallback={<Spinner />}><C /></Suspense>;
};

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
      { path: "/admin/login", element: l(() => import("./pages/admin/AdminLogin")) },
      {
        path: "/admin",
        element: <RequireStaff />,
        children: [
          { index: true, element: l(() => import("./pages/admin/AdminDashboard")) },
          { path: "payments", element: l(() => import("./pages/admin/AdminPayments")) },
          { path: "members", element: l(() => import("./pages/admin/AdminMembers")) },
          { path: "memberships", element: l(() => import("./pages/admin/AdminMemberships")) },
        ],
      },
      { path: "*", element: l(() => import("./pages/ErrorPages").then((m) => ({ default: m.NotFound }))) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
