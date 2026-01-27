import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import LanguagePicker from "../components/LanguagePicker";
import logo from "../assets/ChatGPT Image Jan 24, 2026, 07_44_14 AM.png";
import Windows98ReadingPane from "../components/Windows98ReadingPane";
import Windows98Window from "../components/Windows98Window";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Windows98Window title={t("auth.forgotPassword")}>
          <div className="space-y-6">
            {/* Logo and Info Section */}
            <Windows98ReadingPane>
              <div className="space-y-2">
                <div className="flex justify-center">
                  <img
                    src={logo}
                    alt="The Newsletter"
                    className="h-12 w-auto"
                  />
                </div>
                <p className="text-xs text-black text-center">
                  {t("auth.forgotPasswordDescription")}
                </p>
              </div>
            </Windows98ReadingPane>

            {success ? (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-black text-xs">
                <p className="font-bold">{t("auth.resetCodeSent")}</p>
                <p className="text-xs mt-1">{t("auth.checkEmailForCode")}</p>
                <div className="mt-4">
                  <Link
                    to="/reset-password"
                    className="text-xs font-bold text-[#000080] hover:underline"
                  >
                    {t("auth.enterResetCode")} →
                  </Link>
                </div>
              </div>
            ) : (
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

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="win98-button max-w-xs disabled:opacity-50"
                    >
                      {loading ? t("common.loading") : t("auth.sendResetCode")}
                    </button>
                  </div>
                </div>

                <div className="text-center space-y-3 pt-2 border-t border-[#808080]">
                  <Link
                    to="/login"
                    className="font-bold text-[#000080] hover:underline text-xs block"
                  >
                    {t("auth.backToLogin")}
                  </Link>
                  <div className="flex justify-center">
                    <LanguagePicker />
                  </div>
                </div>
              </form>
            )}
          </div>
        </Windows98Window>
      </div>
    </div>
  );
}
