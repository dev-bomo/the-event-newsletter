import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import LanguagePicker from "../components/LanguagePicker";
import WallpaperPicker, {
  getWallpaperCSS,
} from "../components/WallpaperPicker";
import logo1line from "../assets/logo1line.png";
import logo3lines from "../assets/logo3lines.png";
import Windows98Window from "../components/Windows98Window";

export default function LandingPage() {
  const { t } = useTranslation();
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);

  useEffect(() => {
    const applyWallpaper = () => {
      const wallpaperCSS = getWallpaperCSS();
      document.body.setAttribute("style", wallpaperCSS);
      const root = document.getElementById("root");
      if (root) {
        root.setAttribute("style", wallpaperCSS + "; min-height: 100vh;");
      }
    };

    applyWallpaper();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "win98-wallpaper") applyWallpaper();
    };
    const handleWallpaperChange = () => applyWallpaper();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("wallpaper-changed", handleWallpaperChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("wallpaper-changed", handleWallpaperChange);
    };
  }, []);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Windows98Window title={t("landing.heroTitle")} className="!border">
          {/* One big reading pane — white background, all content inside */}
          <div className="bg-white border border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-4 md:p-6 space-y-6">
            {/* Section 1: Hero */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-6">
                <img
                  src={logo3lines}
                  alt="The Event Newsletter"
                  className="h-32 w-auto md:hidden"
                />
                <img
                  src={logo1line}
                  alt="The Event Newsletter"
                  className="h-16 w-auto hidden md:block"
                />
              </div>
              <p className="text-sm font-bold text-black">
                {t("login.description")}
              </p>
              <p className="text-xs text-[#404040]">{t("landing.heroSub")}</p>
              <div className="flex justify-center gap-3 pt-1">
                <Link to="/register" className="win98-button font-bold">
                  {t("auth.register")}
                </Link>
                <Link to="/login" className="win98-button font-bold">
                  {t("auth.login")}
                </Link>
              </div>
            </div>

            <hr className="border-0 h-px bg-[#c0c0c0]" />

            {/* Section 2: Why This Exists */}
            <div className="space-y-3">
              <div className="bg-[#000080] text-white text-xs font-bold px-2 py-1 inline-block">
                {t("login.whyExists")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    title: t("landing.why1Title"),
                    desc: t("landing.why1Desc"),
                    icon: (
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <circle
                          cx="16"
                          cy="16"
                          r="13"
                          fill="#ff0000"
                          stroke="#c00000"
                          strokeWidth="2"
                        />
                        <rect
                          x="6"
                          y="14"
                          width="20"
                          height="4"
                          rx="1"
                          fill="#ffffff"
                        />
                      </svg>
                    ),
                  },
                  {
                    title: t("landing.why2Title"),
                    desc: t("landing.why2Desc"),
                    icon: (
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="7"
                          width="28"
                          height="18"
                          rx="2"
                          fill="#ffff80"
                          stroke="#808080"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M2 8 L16 18 L30 8"
                          stroke="#808080"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    ),
                  },
                  {
                    title: t("landing.why3Title"),
                    desc: t("landing.why3Desc"),
                    icon: (
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M16 2 L19.5 11.5 L30 11.5 L21.5 18 L24.5 28 L16 22 L7.5 28 L10.5 18 L2 11.5 L12.5 11.5 Z"
                          fill="#ffff00"
                          stroke="#000080"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="bg-[#f0f0f0] border border-[#c0c0c0] p-3 flex flex-col items-center text-center"
                  >
                    <div className="mb-2">{item.icon}</div>
                    <p className="text-xs text-[#000080] font-bold mb-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-black">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-0 h-px bg-[#c0c0c0]" />

            {/* Section 3: How It Works — vertical layout */}
            <div className="space-y-3">
              <div className="bg-[#000080] text-white text-xs font-bold px-2 py-1 inline-block">
                {t("dashboard.howItWorks.title")}
              </div>
              <div className="space-y-3">
                {[
                  {
                    text: t("landing.step1"),
                    icon: (
                      // Sliders / preferences
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <line
                          x1="4"
                          y1="8"
                          x2="28"
                          y2="8"
                          stroke="#808080"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="12"
                          cy="8"
                          r="3"
                          fill="#000080"
                          stroke="#000080"
                          strokeWidth="1"
                        />
                        <line
                          x1="4"
                          y1="16"
                          x2="28"
                          y2="16"
                          stroke="#808080"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="21"
                          cy="16"
                          r="3"
                          fill="#000080"
                          stroke="#000080"
                          strokeWidth="1"
                        />
                        <line
                          x1="4"
                          y1="24"
                          x2="28"
                          y2="24"
                          stroke="#808080"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="15"
                          cy="24"
                          r="3"
                          fill="#000080"
                          stroke="#000080"
                          strokeWidth="1"
                        />
                      </svg>
                    ),
                  },
                  {
                    text: t("landing.step2"),
                    icon: (
                      // Person / profile
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <circle
                          cx="16"
                          cy="10"
                          r="6"
                          fill="#ffcc66"
                          stroke="#000080"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M4 28 C4 20 10 16 16 16 C22 16 28 20 28 28"
                          fill="#008080"
                          stroke="#000080"
                          strokeWidth="1.5"
                        />
                      </svg>
                    ),
                  },
                  {
                    text: t("landing.step3"),
                    icon: (
                      // Calendar
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="6"
                          width="26"
                          height="22"
                          rx="2"
                          fill="#ffffff"
                          stroke="#808080"
                          strokeWidth="1.5"
                        />
                        <rect
                          x="3"
                          y="6"
                          width="26"
                          height="7"
                          rx="2"
                          fill="#c00000"
                        />
                        <line
                          x1="9"
                          y1="3"
                          x2="9"
                          y2="9"
                          stroke="#404040"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="23"
                          y1="3"
                          x2="23"
                          y2="9"
                          stroke="#404040"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="10" cy="18" r="1.5" fill="#000000" />
                        <circle cx="16" cy="18" r="1.5" fill="#000000" />
                        <circle cx="22" cy="18" r="1.5" fill="#000080" />
                        <circle cx="10" cy="24" r="1.5" fill="#000000" />
                        <circle cx="16" cy="24" r="1.5" fill="#000000" />
                        <circle cx="22" cy="24" r="1.5" fill="#000000" />
                      </svg>
                    ),
                  },
                  {
                    text: t("landing.step4"),
                    icon: (
                      // Funnel / filter
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M2 4 L30 4 L19 16 L19 26 L13 28 L13 16 Z"
                          fill="#c0c0c0"
                          stroke="#404040"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13 16 L19 16 L19 26 L13 28 Z"
                          fill="#008080"
                        />
                      </svg>
                    ),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-[#f0f0f0] border border-[#c0c0c0] p-3 flex items-start gap-3"
                  >
                    <div className="flex-shrink-0">{item.icon}</div>
                    <p className="text-xs text-black pt-2">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-0 h-px bg-[#c0c0c0]" />

            {/* Section 4: What to Expect */}
            <div className="space-y-3">
              <div className="bg-[#000080] text-white text-xs font-bold px-2 py-1 inline-block">
                {t("login.expectation")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    text: t("landing.expect1"),
                    icon: (
                      // Wrench / tool
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M22 4 C19 4 17 6 17 9 C17 10.5 17.5 11.8 18.4 12.8 L7 24 C6 25 6 26.5 7 27.5 C8 28.5 9.5 28.5 10.5 27.5 L21.8 16.2 C22.5 16.5 23.2 16.6 24 16.6 C27 16.6 29.5 14 29.5 11 C29.5 10 29.2 9 28.7 8.2 L25 12 L22 11 L21 8 L24.8 4.3 C23.9 4.1 23 4 22 4 Z"
                          fill="#c0c0c0"
                          stroke="#808080"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    text: t("landing.expect2"),
                    icon: (
                      // Lightbulb
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M16 3 C11 3 7 7 7 12 C7 15.5 9 18 11 20 L11 23 L21 23 L21 20 C23 18 25 15.5 25 12 C25 7 21 3 16 3 Z"
                          fill="#ffff00"
                          stroke="#808080"
                          strokeWidth="1.5"
                        />
                        <rect
                          x="11"
                          y="24"
                          width="10"
                          height="2"
                          rx="1"
                          fill="#c0c0c0"
                          stroke="#808080"
                          strokeWidth="1"
                        />
                        <rect
                          x="12"
                          y="27"
                          width="8"
                          height="2"
                          rx="1"
                          fill="#c0c0c0"
                          stroke="#808080"
                          strokeWidth="1"
                        />
                        <line
                          x1="3"
                          y1="12"
                          x2="5"
                          y2="12"
                          stroke="#ffff00"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="27"
                          y1="12"
                          x2="29"
                          y2="12"
                          stroke="#ffff00"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="6"
                          y1="5"
                          x2="7.5"
                          y2="6.5"
                          stroke="#ffff00"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="26"
                          y1="5"
                          x2="24.5"
                          y2="6.5"
                          stroke="#ffff00"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-[#f0f0f0] border border-[#c0c0c0] p-3 flex flex-col items-center text-center"
                  >
                    <div className="mb-2">{item.icon}</div>
                    <p className="text-xs text-black">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-0 h-px bg-[#c0c0c0]" />

            {/* Section 5: Privacy & Pricing */}
            <div className="space-y-3">
              <div className="bg-[#000080] text-white text-xs font-bold px-2 py-1 inline-block">
                {t("landing.privacyTitle")}
              </div>
              <ul className="space-y-2 text-xs text-black">
                <li>{t("landing.privacy1")}</li>
                <li>{t("landing.privacy2")}</li>
                <li>{t("landing.privacy3")}</li>
              </ul>
            </div>

            <hr className="border-0 h-px bg-[#c0c0c0]" />

            {/* Section 6: Footer CTA */}
            <div className="text-center space-y-3">
              <Link to="/register" className="win98-button font-bold">
                {t("landing.getStarted")}
              </Link>
              <div className="text-xs text-black">
                <Link
                  to="/terms"
                  className="text-[#000080] hover:underline font-bold"
                >
                  {t("footer.terms")}
                </Link>
                {" · "}
                <Link
                  to="/privacy"
                  className="text-[#000080] hover:underline font-bold"
                >
                  {t("footer.privacy")}
                </Link>
              </div>
              <p className="text-xs text-[#808080]">
                {t("footer.copyright", { year: new Date().getFullYear() })}
              </p>
              <div className="flex justify-center">
                <LanguagePicker
                  onWallpaperClick={() => setWallpaperPickerOpen(true)}
                />
              </div>
            </div>
          </div>
        </Windows98Window>
      </div>

      <WallpaperPicker
        isOpen={wallpaperPickerOpen}
        onClose={() => setWallpaperPickerOpen(false)}
      />
    </div>
  );
}
