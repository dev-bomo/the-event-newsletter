import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Windows98Window from "./Windows98Window";

import bubblesImg from "../assets/wallpapers/bubbles.png";
import leavesImg from "../assets/wallpapers/leaves.png";
import mysteryImg from "../assets/wallpapers/mystery.png";
import pumaImg from "../assets/wallpapers/puma.png";
import tilesImg from "../assets/wallpapers/tiles.png";

export type WallpaperOption = {
  id: string;
  name: string;
  css: string;
  previewStyle: React.CSSProperties; // For preview thumbnail (image or color)
};

const WALLPAPERS: WallpaperOption[] = [
  {
    id: "teal",
    name: "Teal (Default)",
    css: "background: #008080; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);",
    previewStyle: { background: "#008080" },
  },
  {
    id: "bubbles",
    name: "Bubbles",
    css: `background: #87CEEB url(${bubblesImg}) repeat;`,
    previewStyle: { background: `#87CEEB url(${bubblesImg}) repeat` },
  },
  {
    id: "leaves",
    name: "Leaves",
    css: `background: #2d5016 url(${leavesImg}) repeat;`,
    previewStyle: { background: `#2d5016 url(${leavesImg}) repeat` },
  },
  {
    id: "mystery",
    name: "Mystery",
    css: `background-color: #1a1a2e; background-image: url(${mysteryImg}); background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed;`,
    previewStyle: { background: `#1a1a2e url(${mysteryImg}) center/cover no-repeat` },
  },
  {
    id: "puma",
    name: "Puma",
    css: `background-color: #2d2d2d; background-image: url(${pumaImg}); background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed;`,
    previewStyle: { background: `#2d2d2d url(${pumaImg}) center/cover no-repeat` },
  },
  {
    id: "tiles",
    name: "Tiles",
    css: `background: #c0c0c0 url(${tilesImg}) repeat;`,
    previewStyle: { background: `#c0c0c0 url(${tilesImg}) repeat` },
  },
];

const WALLPAPER_STORAGE_KEY = "win98-wallpaper";

export function getWallpaperCSS(): string {
  if (typeof window === "undefined") return WALLPAPERS[0].css;
  const saved = localStorage.getItem(WALLPAPER_STORAGE_KEY);
  const wallpaper = WALLPAPERS.find((w) => w.id === saved) || WALLPAPERS[0];
  return wallpaper.css;
}

export function setWallpaper(id: string) {
  localStorage.setItem(WALLPAPER_STORAGE_KEY, id);
  const wallpaper = WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];
  // Apply to body
  document.body.setAttribute("style", wallpaper.css);
  // Also apply to root element to ensure full coverage
  const root = document.getElementById("root");
  if (root) {
    root.setAttribute("style", wallpaper.css + "; min-height: 100vh;");
  }
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent("wallpaper-changed", { detail: { id } }));
}

export function getCurrentWallpaper(): string {
  if (typeof window === "undefined") return WALLPAPERS[0].id;
  const saved = localStorage.getItem(WALLPAPER_STORAGE_KEY);
  return saved || WALLPAPERS[0].id;
}

interface WallpaperPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WallpaperPicker({
  isOpen,
  onClose,
}: WallpaperPickerProps) {
  const { t } = useTranslation();
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(
    getCurrentWallpaper()
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedWallpaper(getCurrentWallpaper());
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    setSelectedWallpaper(id);
    setWallpaper(id);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Windows98Window title={t("wallpaper.title")} onClose={onClose}>
          <div className="p-3">
            <p className="text-xs text-black mb-3">
              {t("wallpaper.select")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {WALLPAPERS.map((wallpaper) => (
                <button
                  key={wallpaper.id}
                  onClick={() => handleSelect(wallpaper.id)}
                  className={`relative border-2 ${
                    selectedWallpaper === wallpaper.id
                      ? "border-[#000080] border-4"
                      : "border-[#808080] hover:border-[#000080]"
                  } bg-[#c0c0c0] p-1 focus:outline-none`}
                >
                  <div
                    className="w-20 h-16 border border-[#808080]"
                    style={wallpaper.previewStyle}
                  />
                  <div className="mt-1 text-xs font-bold text-black text-center">
                    {wallpaper.name}
                  </div>
                  {selectedWallpaper === wallpaper.id && (
                    <div className="absolute top-0 right-0 bg-[#000080] text-white text-xs font-bold px-1">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </Windows98Window>
      </div>
    </>
  );
}

