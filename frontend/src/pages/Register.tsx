import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import LanguagePicker from "../components/LanguagePicker";
import logo from "../assets/ChatGPT Image Jan 24, 2026, 07_44_14 AM.png";
import Windows98ReadingPane from "../components/Windows98ReadingPane";
import Windows98Window from "../components/Windows98Window";

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageExpanded, setMessageExpanded] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        name: name || undefined,
      });
      setAuth(response.data.token, response.data.user);
      navigate("/onboarding");
    } catch (err: any) {
      setError(err.response?.data?.error || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md md:max-w-2xl w-full">
        <Windows98Window title={t("auth.registerTitle")}>
          <div className="space-y-6">
            {/* Logo and Info Section */}
            <Windows98ReadingPane>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={logo}
                    alt="The Newsletter"
                    className="h-12 w-auto"
                  />
                </div>
                {messageExpanded && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-black">{t("login.description")}</p>
                    <div className="md:grid md:grid-cols-2 md:gap-4">
                      <div className="space-y-2">
                        <p className="font-bold text-black text-xs">
                          {t("login.whyExists")}
                        </p>
                        <ul className="list-none space-y-1 ml-2 text-xs text-black">
                          <li>• {t("login.why1")}</li>
                          <li>• {t("login.why2")}</li>
                          <li>• {t("login.why3")}</li>
                        </ul>
                      </div>
                      <div className="space-y-2 mt-4 md:mt-0">
                        <p className="font-bold text-black text-xs">
                          {t("login.failure")}
                        </p>
                        <ul className="list-none space-y-1 ml-2 text-xs text-black">
                          <li>• {t("login.failure1")}</li>
                          <li>• {t("login.failure2")}</li>
                        </ul>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMessageExpanded(false)}
                      className="text-xs font-bold text-[#000080] hover:underline"
                    >
                      Hide details
                    </button>
                  </div>
                )}
                {!messageExpanded && (
                  <button
                    type="button"
                    onClick={() => setMessageExpanded(true)}
                    className="text-xs font-bold text-[#000080] hover:underline"
                  >
                    {t("login.title")} →
                  </button>
                )}
              </div>
            </Windows98ReadingPane>

            {/* Register Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-3 py-2 text-black text-xs">
                  {error}
                </div>
              )}
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-xs">
                  <label
                    htmlFor="name"
                    className="block text-xs font-bold text-black mb-1"
                  >
                    {t("auth.name")} ({t("common.optional")})
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="win98-input w-full"
                    placeholder={t("auth.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
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
                    autoComplete="new-password"
                    required
                    minLength={8}
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
                    {loading ? t("common.loading") : t("auth.register")}
                  </button>
                </div>
              </div>

              <div className="text-center space-y-3 pt-2 border-t border-[#808080]">
                <Link
                  to="/login"
                  className="font-bold text-[#000080] hover:underline text-xs block"
                >
                  {t("auth.alreadyHaveAccount")} {t("auth.signInHere")}
                </Link>
                <div className="flex justify-center">
                  <LanguagePicker />
                </div>
              </div>
            </form>
          </div>
        </Windows98Window>
      </div>
    </div>
  );
}
