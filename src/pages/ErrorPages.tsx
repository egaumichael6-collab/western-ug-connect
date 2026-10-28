import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { Logo } from "../components/Logo";

export function NotFound() {
  usePageMeta("Page not found", undefined, { noindex: true });
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-7xl font-bold text-gold-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">We couldn't find that page</h1>
      <p className="mt-2 max-w-md text-slate-600">The link may be old, or the page may have moved. Let's get you back on your journey.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn-primary">Go home</Link>
        <Link to="/contact" className="btn-outline">Contact us</Link>
      </div>
    </div>
  );
}

/** Router-level error screen (also catches crashes in any page). */
export function ErrorPage() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  // Old cached pages after a new deploy can fail to load their code chunk — a reload fixes it.
  const chunk = err instanceof Error && /dynamically imported module|Loading chunk/i.test(err.message);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-plum-50 px-6 text-center">
      <Logo />
      <h1 className="mt-8 text-2xl font-bold">{notFound ? "Page not found" : "Something went wrong"}</h1>
      <p className="mt-2 max-w-md text-slate-600">
        {chunk ? "A new version of the site is available." : "Sorry — an unexpected error occurred. Your data is safe. Please try again."}
      </p>
      <div className="mt-6 flex gap-3">
        <button className="btn-primary" onClick={() => window.location.reload()}>Reload page</button>
        <a href="/" className="btn-outline">Go home</a>
      </div>
    </div>
  );
}
