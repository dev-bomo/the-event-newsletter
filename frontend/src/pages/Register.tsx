import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import LanguagePicker from "../components/LanguagePicker";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md md:max-w-2xl w-full space-y-8">
        <div className="flex justify-end">
          <LanguagePicker />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("auth.registerTitle")}
          </h2>
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-gray-700">
            <button
              type="button"
              onClick={() => setMessageExpanded(!messageExpanded)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-indigo-100 transition-colors rounded-lg"
            >
              <h3 className="font-semibold text-gray-900">
                {t("login.title")}
              </h3>
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  messageExpanded ? "transform rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {messageExpanded && (
              <div className="px-6 pb-6">
                <div className="mb-6">
                  <p>{t("login.description")}</p>
                </div>
                <div className="md:grid md:grid-cols-2 md:gap-6">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {t("login.whyExists")}
                    </p>
                    <ul className="list-none space-y-1.5 ml-2">
                      <li>{t("login.why1")}</li>
                      <li>{t("login.why2")}</li>
                      <li>{t("login.why3")}</li>
                    </ul>
                  </div>
                  <div className="space-y-2 mt-4 md:mt-0">
                    <p className="font-medium text-gray-900">
                      {t("login.failure")}
                    </p>
                    <ul className="list-none space-y-1.5 ml-2">
                      <li>{t("login.failure1")}</li>
                      <li>{t("login.failure2")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                {t("auth.name")} ({t("common.optional")})
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t("auth.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                {t("auth.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? t("common.loading") : t("auth.register")}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t("auth.alreadyHaveAccount")} {t("auth.signInHere")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
