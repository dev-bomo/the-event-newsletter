import { useState, useEffect } from "react";
import Windows98Window from "./Windows98Window";

export type WallpaperOption = {
  id: string;
  name: string;
  css: string;
  previewColor: string; // Single color for preview
};

const WALLPAPERS: WallpaperOption[] = [
  {
    id: "teal",
    name: "Teal (Default)",
    css: "background: #008080; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);",
    previewColor: "#008080",
  },
  {
    id: "clouds",
    name: "Clouds",
    css: "background: linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 30%, #E0F6FF 50%, #FFFFFF 70%, #E0F6FF 100%); background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 15%, transparent 30%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 20%, transparent 40%), radial-gradient(circle at 50% 70%, rgba(255,255,255,0.6) 0%, transparent 25%);",
    previewColor: "#87CEEB",
  },
  {
    id: "forest",
    name: "Forest",
    css: "background: linear-gradient(135deg, #2d5016 0%, #1a3009 30%, #0d1804 60%, #1a3009 100%); background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px);",
    previewColor: "#2d5016",
  },
  {
    id: "bubbles",
    name: "Bubbles",
    css: "background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #90CAF9 100%); background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 8%, transparent 15%), radial-gradient(circle at 75% 50%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 10%, transparent 18%), radial-gradient(circle at 50% 75%, rgba(255,255,255,0.4) 0%, transparent 12%), radial-gradient(circle at 15% 60%, rgba(255,255,255,0.5) 0%, transparent 14%), radial-gradient(circle at 85% 25%, rgba(255,255,255,0.4) 0%, transparent 11%);",
    previewColor: "#BBDEFB",
  },
  {
    id: "sandstone",
    name: "Sandstone",
    css: "background: linear-gradient(135deg, #D2B48C 0%, #C19A6B 25%, #A0826D 50%, #8B7355 75%, #6B5B4D 100%); background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px), repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 1px, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px);",
    previewColor: "#C19A6B",
  },
];

const WALLPAPER_STORAGE_KEY = "win98-wallpaper";

// Helper function to convert CSS string to style object
function cssToStyle(css: string): Record<string, string> {
  const style: Record<string, string> = {};
  
  // Extract background (everything before background-image)
  const backgroundMatch = css.match(/background:\s*([^;]+)/);
  if (backgroundMatch) {
    style.background = backgroundMatch[1].trim();
  }
  
  // Extract background-image (everything after background-image:)
  const bgImageMatch = css.match(/background-image:\s*([^;]+)/);
  if (bgImageMatch) {
    style.backgroundImage = bgImageMatch[1].trim();
  }
  
  // If no background found, use preview color as fallback
  if (!style.background && !style.backgroundImage) {
    const wallpaper = WALLPAPERS.find(w => w.css === css);
    if (wallpaper) {
      style.background = wallpaper.previewColor;
    }
  }
  
  return style;
}

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
        <Windows98Window title="Desktop Wallpaper" onClose={onClose}>
          <div className="p-3">
            <p className="text-xs text-black mb-3">
              Select a wallpaper for your desktop:
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
                    style={cssToStyle(wallpaper.css)}
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

