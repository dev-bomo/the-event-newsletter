import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import LanguagePicker from "./LanguagePicker";
import { useState, useEffect } from "react";
import logo from "../assets/ChatGPT Image Jan 24, 2026, 07_44_14 AM.png";
import Windows98Sidebar from "./Windows98Sidebar";
import { getWallpaperCSS } from "./WallpaperPicker";
import WallpaperPicker from "./WallpaperPicker";
import HowItWorksOverlay from "./HowItWorksOverlay";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Apply wallpaper from localStorage on mount
    const applyWallpaper = () => {
      const wallpaperCSS = getWallpaperCSS();
      // Apply to body
      document.body.setAttribute("style", wallpaperCSS);
      // Also apply to root element to ensure full coverage
      const root = document.getElementById("root");
      if (root) {
        root.setAttribute("style", wallpaperCSS + "; min-height: 100vh;");
      }
    };
    
    applyWallpaper();
    
    // Listen for storage changes to update wallpaper when changed in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "win98-wallpaper") {
        applyWallpaper();
      }
    };
    
    // Listen for custom event when wallpaper changes in same tab
    const handleWallpaperChange = () => {
      applyWallpaper();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wallpaper-changed", handleWallpaperChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wallpaper-changed", handleWallpaperChange);
    };
  }, []);

  const navigation = [
    { name: t("nav.newsletters"), href: "/newsletters", key: "newsletters" },
    { name: t("nav.preferences"), href: "/preferences", key: "preferences" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Windows 98 Taskbar */}
      <nav className="fixed top-0 left-0 right-0 h-12 bg-[#c0c0c0] border-b-2 border-[#808080] flex items-center z-50">
        {/* Mobile: Start Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] h-full px-3 font-bold text-xs hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff]"
        >
          <span className="text-[#000080]">☰</span>
        </button>

        {/* Desktop: Start Button with Logo */}
        <Link
          to="/newsletters"
          className="hidden md:flex bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] h-full px-2 items-center hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff]"
        >
          <img
            src={logo}
            alt="The Newsletter"
            className="h-8 w-auto"
          />
        </Link>

        {/* Mobile: Logo */}
        <Link
          to="/newsletters"
          className="md:hidden flex-1 flex justify-center items-center h-full"
        >
          <img
            src={logo}
            alt="The Newsletter"
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop: Application Buttons */}
        <div className="hidden md:flex flex-1 gap-1 px-1 items-center">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? "bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]"
                    : "bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] hover:bg-[#d4d0c8]"
                } px-3 py-1 text-xs font-bold flex items-center h-10`}
              >
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={() => setHowItWorksOpen(true)}
            className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] w-10 h-10 flex items-center justify-center hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff]"
            title={t("dashboard.howItWorks.title")}
            aria-label={t("dashboard.howItWorks.title")}
          >
            <span className="text-[#000080] font-bold text-base">?</span>
          </button>
        </div>

        {/* Desktop: System Tray */}
        <div className="hidden md:flex bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] h-full items-center gap-2 px-2">
          <LanguagePicker onWallpaperClick={() => setWallpaperPickerOpen(true)} />
          <div className="text-xs px-2 py-1 border border-[#808080] bg-[#c0c0c0]">
            {user?.email}
          </div>
          <button
            onClick={clearAuth}
            className="text-xs px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] bg-[#c0c0c0] hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] font-bold"
          >
            {t("common.signOut")}
          </button>
          {/* Clock */}
          <div className="text-xs px-2 py-1 border border-[#808080] bg-[#c0c0c0] font-bold">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <Windows98Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onHowItWorksClick={() => setHowItWorksOpen(true)}
      />

      {/* Wallpaper Picker */}
      <WallpaperPicker
        isOpen={wallpaperPickerOpen}
        onClose={() => setWallpaperPickerOpen(false)}
      />

      {/* How it works overlay */}
      <HowItWorksOverlay
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />

      <main className="flex-1 pt-12">{children}</main>

      {/* Footer - at bottom of viewport when content is short, at bottom of content when long */}
      <footer className="bg-[#c0c0c0] border-t-2 border-[#808080] py-2 px-4 text-center">
        <div className="text-xs text-black">
          © {new Date().getFullYear()} Good Software.{" "}
          <Link to="/terms" className="text-[#000080] hover:underline font-bold">
            {t("footer.terms")}
          </Link>
          {" · "}
          <Link to="/privacy" className="text-[#000080] hover:underline font-bold">
            {t("footer.privacy")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
