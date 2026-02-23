import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import LanguagePicker from "../components/LanguagePicker";
import WallpaperPicker from "../components/WallpaperPicker";
import logo from "../assets/logo3lines.png";
import Windows98Window from "../components/Windows98Window";
import Windows98ReadingPane from "../components/Windows98ReadingPane";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      setAuth(response.data.token, response.data.user);
      navigate("/newsletters");
    } catch (err: any) {
      setError(err.response?.data?.error || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md md:max-w-2xl w-full">
        <Windows98Window title={t("auth.loginTitle")}>
          <div className="space-y-6">
            {/* Logo and Info Section */}
            <Windows98ReadingPane>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={logo}
                    alt="The Event Newsletter"
                    className="h-36 w-auto"
                  />
                </div>
                {showInfoWindow && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-black">
                      {t("login.description")}
                    </p>
                    <div className="md:grid md:grid-cols-2 md:gap-4">
                      <div className="space-y-2">
                        <p className="font-bold text-black text-xs">
                          {t("login.whyExists")}
                        </p>
                        <div className="space-y-1 text-xs text-black">
                          <p>{t("login.why1")}</p>
                          <p>{t("login.why2")}</p>
                          <p>{t("login.why3")}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4 md:mt-0">
                        <p className="font-bold text-black text-xs">
                          {t("login.expectation")}
                        </p>
                        <div className="space-y-1 text-xs text-black">
                          <p>{t("login.expect1")}</p>
                          <p>{t("login.expect2")}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInfoWindow(false)}
                      className="text-xs font-bold text-[#000080] hover:underline"
                    >
                      {t("login.hideDetails")}
                    </button>
                  </div>
                )}
                {!showInfoWindow && (
                  <button
                    type="button"
                    onClick={() => setShowInfoWindow(true)}
                    title={t("login.expandHint")}
                    className="text-sm font-bold text-black text-left hover:text-[#000080] transition-colors"
                  >
                    {t("login.description")} ▼
                  </button>
                )}
              </div>
            </Windows98ReadingPane>

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-black text-xs">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-xs">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-black mb-1"
                  >
                    {t("auth.email")}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="win98-input w-full"
                    placeholder={t("auth.email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="w-full max-w-xs">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-black mb-1"
                  >
                    {t("auth.password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="win98-input w-full"
                    placeholder={t("auth.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="win98-button max-w-xs disabled:opacity-50"
                  >
                    {loading ? t("common.loading") : t("auth.login")}
                  </button>
                </div>
              </div>

              <div className="text-center space-y-3 pt-2 border-t border-[#808080]">
                <div className="space-y-2">
                  <Link
                    to="/register"
                    className="font-bold text-[#000080] hover:underline text-xs block"
                  >
                    {t("auth.dontHaveAccount")} {t("auth.createAccountHere")}
                  </Link>
                  <Link
                    to="/forgot-password"
                    className="font-bold text-[#000080] hover:underline text-xs block"
                  >
                    {t("auth.forgotPasswordQuestion")}{" "}
                    {t("auth.resetPasswordHere")}
                  </Link>
                </div>
                <div className="flex justify-center">
                  <LanguagePicker
                    onWallpaperClick={() => setWallpaperPickerOpen(true)}
                  />
                </div>
              </div>
            </form>
          </div>
        </Windows98Window>

        <WallpaperPicker
          isOpen={wallpaperPickerOpen}
          onClose={() => setWallpaperPickerOpen(false)}
        />
      </div>
    </div>
  );
}
