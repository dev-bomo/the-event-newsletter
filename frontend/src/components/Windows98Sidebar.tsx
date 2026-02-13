import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import LanguagePicker from "./LanguagePicker";
import { useState, useEffect } from "react";
import WallpaperPicker from "./WallpaperPicker";

interface Windows98SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onHowItWorksClick?: () => void;
}

export default function Windows98Sidebar({
  isOpen,
  onClose,
  onHowItWorksClick,
}: Windows98SidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navigation = [
    { name: t("nav.newsletters"), href: "/newsletters", key: "newsletters" },
    { name: t("nav.preferences"), href: "/preferences", key: "preferences" },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-[#c0c0c0] border-r-2 border-[#808080] border-b-2 border-[#808080] z-50 overflow-y-auto">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between h-6">
          <span className="text-xs font-bold">Menu</span>
          <button
            onClick={onClose}
            className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] text-black text-xs font-bold w-5 h-5 flex items-center justify-center hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-4">
          {/* Navigation */}
          <div>
            <div className="text-xs font-bold text-black mb-2">Navigation</div>
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={`${
                      isActive
                        ? "bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]"
                        : "bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] hover:bg-[#d4d0c8]"
                    } block px-3 py-2 text-xs font-bold text-black`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              {onHowItWorksClick && (
                <button
                  onClick={() => {
                    onHowItWorksClick();
                    onClose();
                  }}
                  className="w-full bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] px-3 py-2 text-xs font-bold text-black hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] text-left"
                  title={t("dashboard.howItWorks.title")}
                >
                  ?
                </button>
              )}
            </div>
          </div>

          {/* System Tray Items */}
          <div className="border-t-2 border-[#808080] pt-3">
            <div className="text-xs font-bold text-black mb-2">System</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-black">Language:</span>
                <LanguagePicker onWallpaperClick={() => setWallpaperPickerOpen(true)} />
              </div>
              <div className="text-xs font-bold text-black">
                <div>User:</div>
                <div className="bg-[#c0c0c0] border border-[#808080] px-2 py-1 mt-1">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => {
                  clearAuth();
                  onClose();
                }}
                className="w-full bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] px-3 py-1 text-xs font-bold text-black hover:bg-[#d4d0c8] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff]"
              >
                {t("common.signOut")}
              </button>
              <div className="text-xs font-bold text-black">
                <div>Time:</div>
                <div className="bg-[#c0c0c0] border border-[#808080] px-2 py-1 mt-1">
                  {currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <WallpaperPicker
        isOpen={wallpaperPickerOpen}
        onClose={() => setWallpaperPickerOpen(false)}
      />
    </>
  );
}

