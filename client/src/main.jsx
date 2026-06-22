import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./index.css";
import "./map.css";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";

function normalizeGtaMapTiles() {
  const fix = () => {
    document.querySelectorAll('img[src*="/atlas/"]').forEach((img) => {
      img.src = img.src.replace("/atlas/", "/mainmap/");
    });

    document.querySelectorAll(".gta-map-stage").forEach((stage) => {
      stage.style.perspective = "none";
    });

    document.querySelectorAll(".gta-map-plane-tiles").forEach((plane) => {
      const current = plane.style.transform || "";
      const next = current.replace(/\s*rotateX\([^)]*\)/g, "");
      if (next !== current) plane.style.transform = next;
    });
  };

  fix();
  new MutationObserver(fix).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "src"]
  });
}

normalizeGtaMapTiles();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
