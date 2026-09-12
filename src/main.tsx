import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import LandingPage from "./marketing/LandingPage";
import "./design-system.css";

const WorkspaceApplication = lazy(() => import("./WorkspaceApplication"));
function Site() {
  const { pathname } = useLocation();
  return pathname === "/" ? (
    <LandingPage />
  ) : (
    <Suspense
      fallback={
        <div className="public-wrap" role="status">
          Loading AVERIS…
        </div>
      }
    >
      <WorkspaceApplication />
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
if (window.location.pathname === "/" && root.hasChildNodes()) {
  ReactDOM.hydrateRoot(root, application);
} else {
  ReactDOM.createRoot(root).render(application);
}
