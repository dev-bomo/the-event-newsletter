import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoWhiteVertical from "../assets/whitevertical.png";
import type { WindowId } from "../context/WindowContext";

interface Windows98SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when a menu item is clicked that opens a window (so the window is opened even if route unchanged). */
  onOpenWindow?: (id: WindowId) => void;
  onHowItWorksClick?: () => void;
  onDislikesClick?: () => void;
}

// Same icons as desktop taskbar (Layout.tsx)
const menuItemIcons = {
  newsletters: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1" y="3" width="14" height="10" rx="1" fill="#ffff80" stroke="#808080" strokeWidth="1" />
      <path d="M1 4 L8 9 L15 4" stroke="#808080" strokeWidth="1" fill="none" />
    </svg>
  ),
  preferences: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="5" fill="#c0c0c0" stroke="#404040" strokeWidth="1" />
      <path d="M8 4 L8 5 M8 11 L8 12 M4 8 L5 8 M11 8 L12 8 M5.2 5.2 L6 6 M10 10 L10.8 10.8 M5.2 10.8 L6 10 M10 6 L10.8 5.2" stroke="#404040" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  ),
  dislikes: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="2" y="2" width="12" height="10" rx="1" fill="#c0c0c0" stroke="#808080" strokeWidth="1" />
      <path d="M4 6 L12 6 M6 4 L6 8 M10 4 L10 8" stroke="#800000" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  help: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="6" fill="#ffff80" stroke="#808080" strokeWidth="1" />
      <text x="8" y="8.5" textAnchor="middle" dominantBaseline="middle" fill="#000080" fontSize="9" fontWeight="bold" fontFamily="sans-serif">?</text>
    </svg>
  ),
};

export default function Windows98Sidebar({
  isOpen,
  onClose,
  onOpenWindow,
  onHowItWorksClick,
  onDislikesClick,
}: Windows98SidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { key: "newsletters" as const, label: t("nav.newsletters"), href: "/newsletters", onClick: undefined },
    { key: "preferences" as const, label: t("nav.preferences"), href: "/preferences", onClick: undefined },
    { key: "dislikes" as const, label: t("hates.pageTitle"), href: undefined, onClick: onDislikesClick },
    { key: "help" as const, label: "Info", href: undefined, onClick: onHowItWorksClick },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - invisible, click to dismiss */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />
      {/* Start menu panel: 4px left margin, then 3d border, then blue ribbon + menu. */}
      <div className="fixed left-0 bottom-10 w-64 h-[400px] flex border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] z-50 overflow-hidden bg-[#c0c0c0] ml-1">
        {/* Vertical blue bar with 1-line logo (Win98-style left strip) - same navy as window title bar */}
        <div
          className="w-11 shrink-0 flex items-end justify-center min-h-0 bg-[#000080]"
        >
          <img
            src={logoWhiteVertical}
            alt=""
            className="object-contain"
            style={{
              width: "700%",
              maxWidth: "none",
              marginLeft: "20px",
              marginBottom: "-72px",
            }}
          />
        </div>
        {/* Menu: flat icon + text, blue highlight on hover/selected */}
        <div className="flex-1 min-w-0 p-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isSelected = item.href != null && location.pathname === item.href;
            const btnClass =
              "w-full flex items-center gap-2 pl-2 pr-3 py-2 text-xs font-bold text-left rounded-none border-0 " +
              (isSelected
                ? "bg-[#000080] text-white"
                : "bg-transparent text-black hover:bg-[#000080] hover:text-white");
            if (item.href) {
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => {
                    onOpenWindow?.(item.key);
                    onClose();
                  }}
                  className={btnClass}
                >
                  {menuItemIcons[item.key]}
                  <span>{item.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  onClose();
                }}
                className={btnClass}
              >
                {menuItemIcons[item.key]}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
