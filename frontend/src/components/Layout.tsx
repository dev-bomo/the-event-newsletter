import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import LanguagePicker from "./LanguagePicker";
import logo from "../assets/ChatGPT Image Jan 24, 2026, 07_44_14 AM.png";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const { t } = useTranslation();
  const location = useLocation();

  const navigation = [
    { name: t("nav.dashboard"), href: "/dashboard", key: "dashboard" },
    { name: t("nav.preferences"), href: "/preferences", key: "preferences" },
    { name: t("nav.newsletters"), href: "/newsletters", key: "newsletters" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard">
                  <img
                    src={logo}
                    alt="The Newsletter"
                    className="h-10 w-auto"
                  />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? "border-indigo-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguagePicker />
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={clearAuth}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {t("common.signOut")}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
