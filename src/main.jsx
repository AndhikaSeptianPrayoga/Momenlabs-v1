import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import LandingPage from "./LandingPage.jsx";
import { TEMPLATES } from "./catalog.jsx";
import "./index.css";

// template yang punya file undangan sendiri
const DEDICATED = {
  "dark-elegance": lazy(() => import("./templates/DarkElegance.jsx")),
  "wayang-kencana": lazy(() => import("./templates/WayangKencana.jsx")),
};
// template katalog lain memakai demo bertema
const ThemedDemo = lazy(() => import("./templates/ThemedDemo.jsx"));
// halaman review design system: /?design=1
const StyleGuide = lazy(() => import("./design/StyleGuide.jsx"));

// Demo: /?template=<id katalog>&plan=basic|premium|luxury&to=Nama+Tamu
// Tanpa plan, demo memakai paket asal template di katalog.
const params = new URLSearchParams(window.location.search);
const templateId = params.get("template") ?? "";
const meta = TEMPLATES.find((t) => t.id === templateId);
const plan = params.get("plan") || meta?.tier || "luxury";
const guestName = params.get("to") || "";
const flags = { isPremium: plan !== "basic", isLuxury: plan === "luxury" };

function App() {
  if (params.has("design")) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-noir" />}>
        <StyleGuide />
      </Suspense>
    );
  }
  const Dedicated = Object.hasOwn(DEDICATED, templateId) ? DEDICATED[templateId] : null;
  if (Dedicated || meta) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-noir" />}>
        {Dedicated ? (
          <Dedicated {...flags} guestName={guestName} />
        ) : (
          <ThemedDemo template={meta} {...flags} guestName={guestName} />
        )}
      </Suspense>
    );
  }
  return <LandingPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
