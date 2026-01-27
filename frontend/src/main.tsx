import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getWallpaperCSS } from './components/WallpaperPicker';

// Apply wallpaper on app load
const wallpaperCSS = getWallpaperCSS();
document.body.setAttribute("style", wallpaperCSS);
const root = document.getElementById("root");
if (root) {
  root.setAttribute("style", wallpaperCSS + "; min-height: 100vh;");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

