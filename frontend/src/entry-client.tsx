import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getWallpaperCSS } from "./components/WallpaperPicker";

const wallpaperCSS = getWallpaperCSS();
document.body.setAttribute("style", wallpaperCSS);
const rootElement = document.getElementById("root");
if (rootElement) {
  rootElement.setAttribute("style", `${wallpaperCSS}; min-height: 100vh;`);
  hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
