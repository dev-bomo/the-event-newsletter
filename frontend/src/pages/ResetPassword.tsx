import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import LanguagePicker from "../components/LanguagePicker";
import logo from "../assets/ChatGPT Image Jan 24, 2026, 07_44_14 AM.png";
import Windows98ReadingPane from "../components/Windows98ReadingPane";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email,
        code,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-8">
            <Windows98ReadingPane className="w-64">
              <div className="flex items-center justify-center px-4 py-2">
                <img
                  src={logo}
                  alt="The Newsletter"
                  className="h-12 w-auto"
                />
              </div>
            </Windows98ReadingPane>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-black">
            {t("auth.resetPassword")}
          </h2>
          <p className="mt-2 text-center text-xs text-black">
            {t("auth.enterResetCodeAndPassword")}
          </p>
        </div>

        {success ? (
          <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-4 py-3 text-black text-xs">
            <p className="font-bold">{t("auth.passwordResetSuccess")}</p>
            <p className="text-xs mt-1">{t("auth.redirectingToLogin")}</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-4 py-3 text-black text-xs">
                {error}
              </div>
            )}

            <div>
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
              <label
                htmlFor="code"
                className="block text-xs font-bold text-black mb-1"
              >
                {t("auth.resetCode")}
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                className="win98-input w-full text-center text-xl tracking-widest"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-bold text-black mb-1"
              >
                {t("auth.newPassword")}
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="win98-input w-full"
                placeholder={t("auth.newPassword")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold text-black mb-1"
              >
                {t("auth.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="win98-input w-full"
                placeholder={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="win98-button w-full disabled:opacity-50"
              >
                {loading ? t("common.loading") : t("auth.resetPassword")}
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div>
                  <Link
                    to="/login"
                    className="font-bold text-[#000080] hover:underline text-xs"
                  >
                    {t("auth.rememberPassword")} {t("auth.signInHere")}
                  </Link>
                </div>
                <div>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#000080] hover:underline"
                  >
                    {t("auth.requestNewCode")}
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <LanguagePicker />
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
