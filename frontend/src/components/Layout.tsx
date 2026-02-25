import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import LanguagePickerTray from "./LanguagePickerTray";
import { useState, useEffect, useRef, type ReactNode } from "react";
import Windows98Sidebar from "./Windows98Sidebar";
import { getWallpaperCSS } from "./WallpaperPicker";
import WallpaperPicker from "./WallpaperPicker";
import { WindowProvider, useWindowContext, type WindowId } from "../context/WindowContext";

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutInner({ children }: LayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { windows, toggleWindow, openWindow, minimizeAllExcept, bringToFront } = useWindowContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [personMenuOpen, setPersonMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [legalMenuOpen, setLegalMenuOpen] = useState(false);
  const personMenuRef = useRef<HTMLDivElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);
  const legalMenuRef = useRef<HTMLDivElement>(null);
  const personMenuRefMobile = useRef<HTMLDivElement>(null);
  const supportRefMobile = useRef<HTMLDivElement>(null);
  const legalMenuRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (personMenuRef.current?.contains(target) || personMenuRefMobile.current?.contains(target)) return;
      setPersonMenuOpen(false);
      if (supportRef.current?.contains(target) || supportRefMobile.current?.contains(target)) return;
      setSupportOpen(false);
      if (legalMenuRef.current?.contains(target) || legalMenuRefMobile.current?.contains(target)) return;
      setLegalMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const taskbarButtons: { id: WindowId; label: string; path: string; icon: ReactNode }[] = [
    {
      id: "newsletters",
      label: t("nav.newsletters"),
      path: "/newsletters",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="1" y="3" width="14" height="10" rx="1" fill="#ffff80" stroke="#808080" strokeWidth="1" />
          <path d="M1 4 L8 9 L15 4" stroke="#808080" strokeWidth="1" fill="none" />
        </svg>
      ),
    },
    {
      id: "preferences",
      label: t("nav.preferences"),
      path: "/preferences",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="8" cy="8" r="5" fill="#c0c0c0" stroke="#404040" strokeWidth="1" />
          <path d="M8 4 L8 5 M8 11 L8 12 M4 8 L5 8 M11 8 L12 8 M5.2 5.2 L6 6 M10 10 L10.8 10.8 M5.2 10.8 L6 10 M10 6 L10.8 5.2" stroke="#404040" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "dislikes",
      label: t("hates.pageTitle"),
      path: "/preferences",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="2" y="2" width="12" height="10" rx="1" fill="#c0c0c0" stroke="#808080" strokeWidth="1" />
          <path d="M4 6 L12 6 M6 4 L6 8 M10 4 L10 8" stroke="#800000" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "help",
      label: t("dashboard.howItWorks.title"),
      path: "/newsletters",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="8" cy="8" r="6" fill="#ffff80" stroke="#808080" strokeWidth="1" />
          <text x="8" y="8.5" textAnchor="middle" dominantBaseline="middle" fill="#000080" fontSize="9" fontWeight="bold" fontFamily="sans-serif">?</text>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Windows 98 Taskbar - mobile and desktop at bottom, gray */}
      <nav className="fixed left-0 right-0 bottom-0 h-10 md:h-9 bg-[#c0c0c0] border-t-2 border-[#808080] flex items-center z-50">
        {/* Mobile: Start Button - wider, favicon + "Start" (opens sidebar) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] h-full pl-2 pr-4 font-bold text-base hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] flex items-center justify-center gap-2 shrink-0"
        >
          <img src="/favicon.png" alt="" className="h-8 w-auto" />
          <span className="text-[#000080]">Start</span>
        </button>

        {/* Mobile: System Tray - to the right of Start (person, language, support, legal; no clock) */}
        <div className="md:hidden flex items-center gap-0 shrink-0 ml-auto">
          <div className="flex items-center h-8 mx-0.5 px-0.5 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0]">
            <div className="relative flex items-center" ref={personMenuRefMobile}>
              <button
                type="button"
                onClick={() => setPersonMenuOpen(!personMenuOpen)}
                className="p-0.5 flex items-center justify-center w-8 h-7 hover:bg-[#d4d0c8] border-0 bg-transparent"
                title={user?.email}
                aria-label="Account"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <circle cx="8" cy="5" r="3" fill="#000080" stroke="#000080" strokeWidth="0.5" />
                  <path d="M3 14 Q3 9 8 9 Q13 9 13 14" fill="#000080" stroke="#000080" strokeWidth="0.5" />
                </svg>
              </button>
              {personMenuOpen && (
                <div className="absolute right-0 bottom-full mb-0.5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-lg z-50 min-w-[200px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-black truncate px-2 py-1 mb-1 border border-[#808080] bg-[#c0c0c0]">
                      {user?.email}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearAuth();
                        setPersonMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-black hover:bg-[#000080] hover:text-white border-0 bg-transparent"
                    >
                      {t("common.signOut")}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <LanguagePickerTray onWallpaperClick={() => setWallpaperPickerOpen(true)} />
            <div className="relative flex items-center" ref={supportRefMobile}>
              <button
                type="button"
                onClick={() => setSupportOpen(!supportOpen)}
                className="p-0.5 flex items-center justify-center w-8 h-7 hover:bg-[#d4d0c8] border-0 bg-transparent"
                title="Support"
                aria-label="Support"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <circle cx="8" cy="8" r="6" fill="#ffff80" stroke="#808080" strokeWidth="1" />
                  <text x="8" y="8.5" textAnchor="middle" dominantBaseline="middle" fill="#000080" fontSize="9" fontWeight="bold" fontFamily="sans-serif">?</text>
                </svg>
              </button>
              {supportOpen && (
                <div className="absolute right-0 bottom-full mb-0.5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-lg z-50 w-64">
                  <div className="bg-[#000080] text-white px-2 py-0.5 text-[10px] font-bold flex items-center">
                    {t("common.support")}
                  </div>
                  <div className="p-2 space-y-1 text-[10px] text-black">
                    <p className="font-bold">{t("common.supportEmail")}</p>
                    <p>{t("common.supportInstructions")}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="relative flex items-center" ref={legalMenuRefMobile}>
              <button
                type="button"
                onClick={() => setLegalMenuOpen(!legalMenuOpen)}
                className="p-0.5 flex items-center justify-center w-8 h-7 hover:bg-[#d4d0c8] border-0 bg-transparent"
                title={t("footer.terms") + " · " + t("footer.privacy")}
                aria-label="Terms and Privacy"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <rect x="2" y="1" width="12" height="14" rx="0.5" fill="#ffffff" stroke="#808080" strokeWidth="1" />
                  <line x1="4" y1="4" x2="11" y2="4" stroke="#000080" strokeWidth="0.8" />
                  <line x1="4" y1="6" x2="11" y2="6" stroke="#000080" strokeWidth="0.8" />
                  <line x1="4" y1="8" x2="9" y2="8" stroke="#000080" strokeWidth="0.8" />
                  <text x="12" y="13" textAnchor="middle" fill="#000080" fontSize="7" fontWeight="bold" fontFamily="sans-serif">©</text>
                </svg>
              </button>
              {legalMenuOpen && (
                <div className="absolute right-0 bottom-full mb-0.5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-lg z-50 min-w-[180px]">
                  <div className="bg-[#000080] text-white px-2 py-0.5 text-[10px] font-bold flex items-center">
                    {t("footer.terms")} · {t("footer.privacy")}
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/terms"
                      onClick={() => setLegalMenuOpen(false)}
                      className="block w-full text-left px-3 py-1.5 text-[10px] font-bold text-[#000080] hover:bg-[#000080] hover:text-white"
                    >
                      {t("footer.terms")}
                    </Link>
                    <Link
                      to="/privacy"
                      onClick={() => setLegalMenuOpen(false)}
                      className="block w-full text-left px-3 py-1.5 text-[10px] font-bold text-[#000080] hover:bg-[#000080] hover:text-white"
                    >
                      {t("footer.privacy")}
                    </Link>
                    <div className="border-t border-[#808080] mt-1 pt-1.5 px-3 text-[10px] text-black">
                      © {new Date().getFullYear()} Good Software
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Start Button - same styling as mobile (favicon + "Start"), opens sidebar */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] h-7 pl-2 pr-4 font-bold text-base hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] items-center justify-center gap-2 shrink-0"
        >
          <img src="/favicon.png" alt="" className="h-8 w-auto" />
          <span className="text-[#000080]">Start</span>
        </button>

        {/* Desktop: Application Buttons - taskbar style: click opens or brings to front, click again minimizes */}
        <div className="hidden md:flex flex-1 gap-0.5 px-0.5 items-center min-w-0">
          {taskbarButtons.map(({ id, label, path, icon }) => {
            const isOpen = !windows[id].isMinimized;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const wasMinimized = windows[id].isMinimized;
                  toggleWindow(id);
                  if (wasMinimized && id !== "help" && id !== "dislikes") navigate(path);
                }}
                className={`${
                  isOpen
                    ? "bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]"
                    : "bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] hover:bg-[#d4d0c8]"
                } pl-1.5 pr-2 py-0.5 text-xs font-bold flex items-center gap-1.5 h-7 min-w-0 shrink`}
              >
                {icon}
                <span className="truncate">{id === "help" ? "Info" : label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop: System Tray - depressed area with icons, then clock */}
        <div className="hidden md:flex items-center gap-0 shrink-0">
          {/* Depressed tray area: person, language, help */}
          <div
            className="flex items-center h-7 mx-0.5 px-0.5 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0]"
          >
            {/* Person icon - context menu with email + sign out */}
            <div className="relative flex items-center" ref={personMenuRef}>
              <button
                type="button"
                onClick={() => setPersonMenuOpen(!personMenuOpen)}
                className="p-0.5 flex items-center justify-center w-6 h-5 hover:bg-[#d4d0c8] border-0 bg-transparent"
                title={user?.email}
                aria-label="Account"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <circle cx="8" cy="5" r="3" fill="#000080" stroke="#000080" strokeWidth="0.5" />
                  <path d="M3 14 Q3 9 8 9 Q13 9 13 14" fill="#000080" stroke="#000080" strokeWidth="0.5" />
                </svg>
              </button>
              {personMenuOpen && (
                <div className="absolute right-0 bottom-full mb-0.5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-lg z-50 min-w-[200px]">
                  <div className="p-1.5">
                    <div className="text-[10px] text-black truncate px-2 py-1 mb-1 border border-[#808080] bg-[#c0c0c0]">
                      {user?.email}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearAuth();
                        setPersonMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-black hover:bg-[#000080] hover:text-white border-0 bg-transparent"
                    >
                      {t("common.signOut")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Language picker - tray version: icon only, context menu with languages + wallpaper */}
            <LanguagePickerTray onWallpaperClick={() => setWallpaperPickerOpen(true)} />

            {/* Help / Support - icon opens small window with support email */}
            <div className="relative flex items-center" ref={supportRef}>
              <button
                type="button"
                onClick={() => setSupportOpen(!supportOpen)}
                className="p-0.5 flex items-center justify-center w-6 h-5 hover:bg-[#d4d0c8] border-0 bg-transparent"
                title="Support"
                aria-label="Support"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <circle cx="8" cy="8" r="6" fill="#ffff80" stroke="#808080" strokeWidth="1" />
                  <text x="8" y="8.5" textAnchor="middle" dominantBaseline="middle" fill="#000080" fontSize="9" fontWeight="bold" fontFamily="sans-serif">?</text>
                </svg>
              </button>
              {supportOpen && (
                <div className="absolute right-0 bottom-full mb-0.5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-lg z-50 w-64">
                  <div className="bg-[#000080] text-white px-2 py-0.5 text-[10px] font-bold flex items-center">
                    {t("common.support")}
                  </div>
                  <div className="p-2 space-y-1 text-[10px] text-black">
                    <p className="font-bold">{t("common.supportEmail")}</p>
                    <p>{t("common.supportInstructions")}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Legal / Terms & Privacy - document icon opens menu with Terms, Privacy, copyright */}
            <div className="relative flex items-center" ref={legalMenuRef}>
              <button
                type="button"
                onClick={() => setLegalMenuOpen(!legalMenuOpen)}
                className="p-0.5 flex items-center justify-center w-6 h-5 hover:bg-[#d4d0c8] border-0 bg-transparent"
                title={t("footer.terms") + " · " + t("footer.privacy")}
                aria-label="Terms and Privacy"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <rect x="2" y="1" width="12" height="14" rx="0.5" fill="#ffffff" stroke="#808080" strokeWidth="1" />
                  <line x1="4" y1="4" x2="11" y2="4" stroke="#000080" strokeWidth="0.8" />
                  <line x1="4" y1="6" x2="11" y2="6" stroke="#000080" strokeWidth="0.8" />
                  <line x1="4" y1="8" x2="9" y2="8" stroke="#000080" strokeWidth="0.8" />
                  <text x="12" y="13" textAnchor="middle" fill="#000080" fontSize="7" fontWeight="bold" fontFamily="sans-serif">©</text>
                </svg>
              </button>
              {legalMenuOpen && (
                <div className="absolute right-0 bottom-full mb-0.5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-lg z-50 min-w-[180px]">
                  <div className="bg-[#000080] text-white px-2 py-0.5 text-[10px] font-bold flex items-center">
                    {t("footer.terms")} · {t("footer.privacy")}
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/terms"
                      onClick={() => setLegalMenuOpen(false)}
                      className="block w-full text-left px-3 py-1.5 text-[10px] font-bold text-[#000080] hover:bg-[#000080] hover:text-white"
                    >
                      {t("footer.terms")}
                    </Link>
                    <Link
                      to="/privacy"
                      onClick={() => setLegalMenuOpen(false)}
                      className="block w-full text-left px-3 py-1.5 text-[10px] font-bold text-[#000080] hover:bg-[#000080] hover:text-white"
                    >
                      {t("footer.privacy")}
                    </Link>
                    <div className="border-t border-[#808080] mt-1 pt-1.5 px-3 text-[10px] text-black">
                      © {new Date().getFullYear()} Good Software
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clock - inside the same depressed tray */}
            <div className="text-[10px] px-1.5 py-0.5 font-bold text-black border-l border-[#808080] ml-0.5 pl-1.5">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <Windows98Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenWindow={(id) => {
          if (isMobile) minimizeAllExcept(id);
          openWindow(id);
          bringToFront(id);
        }}
        onHowItWorksClick={() => {
          if (isMobile) minimizeAllExcept("help");
          openWindow("help");
          bringToFront("help");
        }}
        onDislikesClick={() => {
          if (isMobile) minimizeAllExcept("dislikes");
          openWindow("dislikes");
          bringToFront("dislikes");
        }}
      />

      {/* Wallpaper Picker */}
      <WallpaperPicker
        isOpen={wallpaperPickerOpen}
        onClose={() => setWallpaperPickerOpen(false)}
      />

      <main className="flex-1 pt-0 pb-10 md:pt-0 md:pb-9 overflow-x-hidden">{children}</main>
    </div>
  );
}

export default function Layout(props: LayoutProps) {
  return (
    <WindowProvider>
      <LayoutInner {...props} />
    </WindowProvider>
  );
}
