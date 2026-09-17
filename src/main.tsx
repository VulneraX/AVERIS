import React, { lazy, Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { isPublicPath } from "./marketing/publicPaths";
import "./design-system.css";

const initialLocale = document.documentElement.lang === "id" ? "id" : "en";
const PublicSite = lazy(() => import("./marketing/PublicSite"));
const WorkspaceApplication = lazy(() => import("./WorkspaceApplication"));
function Site() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "") || "/";
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [path]);
  return (
    <Suspense
      fallback={
        <div className="public-wrap" role="status">
          Loading AVERIS…
        </div>
      }
    >
      {isPublicPath(path) ? (
        <PublicSite path={path} initialLocale={initialLocale} />
      ) : (
        <WorkspaceApplication />
      )}
    </Suspense>
  );
}
const root = document.getElementById("root")!;
const application = (
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Site />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
// Preserve prerendered public content while its interactive route loads.
if (
  root.hasChildNodes() &&
  isPublicPath(window.location.pathname.replace(/\/$/, "") || "/")
) {
  ReactDOM.hydrateRoot(root, application);
} else {
  ReactDOM.createRoot(root).render(application);
}
