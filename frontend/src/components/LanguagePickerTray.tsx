import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";

interface LanguagePickerTrayProps {
  onWallpaperClick?: () => void;
}

/** Compact language picker for the desktop system tray only. Icon-only button, dropdown opens upward. */
export default function LanguagePickerTray({
  onWallpaperClick,
}: LanguagePickerTrayProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const languages = [
    { code: "en", flag: "gb", label: "English" },
    { code: "ro", flag: "ro", label: "Română" },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Position dropdown above the button using fixed positioning so it's never clipped
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      bottom: window.innerHeight - rect.top + 4,
      right: window.innerWidth - rect.right,
      zIndex: 50,
    });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-0.5 flex items-center justify-center w-6 h-5 hover:bg-[#d4d0c8] border-0 bg-transparent"
        title={currentLanguage.label}
        aria-label="Language"
      >
        <img
          src={`https://flagcdn.com/20x15/${currentLanguage.flag}.png`}
          alt=""
          className="h-3.5 w-4 object-contain"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            style={dropdownStyle}
            className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] min-w-[150px] shadow-lg"
          >
            <div className="p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-1.5 text-[10px] font-bold text-black hover:bg-[#000080] hover:text-white ${
                    currentLanguage.code === lang.code
                      ? "bg-[#000080] text-white"
                      : ""
                  }`}
                >
                  <img
                    src={`https://flagcdn.com/20x15/${lang.flag}.png`}
                    alt=""
                    className="inline-block h-3 w-4 object-contain mr-2 align-middle"
                  />
                  {lang.label}
                </button>
              ))}
              {onWallpaperClick && (
                <>
                  <div className="border-t border-[#808080] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onWallpaperClick();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-black hover:bg-[#000080] hover:text-white"
                  >
                    <span className="mr-2">🖼️</span>
                    Wallpaper
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
