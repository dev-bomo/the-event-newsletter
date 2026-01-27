import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";

interface LanguagePickerProps {
  onWallpaperClick?: () => void;
}

export default function LanguagePicker({ onWallpaperClick }: LanguagePickerProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "en", flag: "🇬🇧" },
    { code: "ro", flag: "🇷🇴" },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <div className="relative inline-block w-12" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="appearance-none bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] pl-7 pr-6 py-1 text-xs font-bold w-full hover:bg-[#d4d0c8] focus:outline-none h-8"
      >
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-lg pointer-events-none">
          {currentLanguage.flag}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-1 text-black pointer-events-none">
          <svg
            className="fill-current h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 bg-[#c0c0c0] border-2 border-[#808080] z-50 min-w-[150px] shadow-lg">
            <div className="p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-2 text-xs font-bold text-black hover:bg-[#000080] hover:text-white ${
                    currentLanguage.code === lang.code ? "bg-[#000080] text-white" : ""
                  }`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.code === "en" ? "English" : "Română"}
                </button>
              ))}
              {onWallpaperClick && (
                <>
                  <div className="border-t border-[#808080] my-1" />
                  <button
                    onClick={() => {
                      onWallpaperClick();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-black hover:bg-[#000080] hover:text-white"
                  >
                    <span className="mr-2">🖼️</span>
                    Change Wallpaper
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
