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
  };
  fix();
  new MutationObserver(fix).observe(document.documentElement, { childList: true, subtree: true });
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
