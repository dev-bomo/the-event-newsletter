import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import Windows98Window from "../components/Windows98Window";
import Windows98ReadingPane from "../components/Windows98ReadingPane";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    hasPreferences: false,
    newsletters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Allow testing wizard via ?testWizard=1 (works even when preferences are already set)
    const params = new URLSearchParams(window.location.search);
    if (params.get("testWizard") === "1") {
      navigate("/onboarding?testWizard=1");
      return;
    }

    const fetchStats = async () => {
      try {
        // Check if user has completed onboarding (has city set)
        // If not, redirect to onboarding immediately
        if (!user?.city) {
          navigate("/onboarding");
          return;
        }

        const [preferencesRes, newslettersRes] = await Promise.all([
          api.get("/preferences"),
          api.get("/newsletters"),
        ]);

        const hasPreferences =
          preferencesRes.data.interests?.length > 0 ||
          preferencesRes.data.genres?.length > 0 ||
          preferencesRes.data.eventTypes?.length > 0;

        setStats({
          hasPreferences: hasPreferences,
          newsletters: newslettersRes.data.length,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-6xl mx-auto">
        <Windows98Window title={t("dashboard.title")}>
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-black">
                {t("dashboard.welcome")}
                {user?.name ? `, ${user.name}` : ""}!
              </h1>
            </div>

            {loading ? (
              <div className="text-black text-xs">{t("common.loading")}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <Windows98ReadingPane>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-xs font-bold text-black">
                        {t("dashboard.stats.preferences")}
                      </div>
                      <div className="text-sm font-bold text-black">
                        {stats.hasPreferences ? t("dashboard.stats.set") : t("dashboard.stats.notSet")}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#808080]">
                    <Link
                      to="/preferences"
                      className="text-xs font-bold text-[#000080] hover:underline"
                    >
                      {t("dashboard.managePreferences")} →
                    </Link>
                  </div>
                </Windows98ReadingPane>

                <Windows98ReadingPane>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl">📧</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-xs font-bold text-black">
                        {t("dashboard.stats.newsletters")}
                      </div>
                      <div className="text-sm font-bold text-black">
                        {stats.newsletters}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#808080]">
                    <Link
                      to="/newsletters"
                      className="text-xs font-bold text-[#000080] hover:underline"
                    >
                      {t("dashboard.viewNewsletters")} →
                    </Link>
                  </div>
                </Windows98ReadingPane>
              </div>
            )}

            <Windows98ReadingPane>
              <h3 className="text-xs font-bold text-black mb-2">
                {t("dashboard.howItWorks.title")}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-black">
                <li>
                  <Link
                    to="/preferences"
                    className="text-[#000080] hover:underline font-bold"
                  >
                    {t("dashboard.howItWorks.step1")}
                  </Link>
                  <span className="text-[#000080] font-bold"> {t("dashboard.howItWorks.keywordsHint")}</span>
                </li>
                <li>{t("dashboard.howItWorks.step2")}</li>
                <li>{t("dashboard.howItWorks.step3")}</li>
                <li>{t("dashboard.howItWorks.step4")}</li>
                <li>{t("dashboard.howItWorks.step5")}</li>
              </ol>
            </Windows98ReadingPane>

            <Windows98ReadingPane>
              <h3 className="text-xs font-bold text-black mb-2">
                {t("dashboard.limits.title")}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-black">
                <li>{t("dashboard.limits.preferences")}</li>
                <li>{t("dashboard.limits.newsletters")}</li>
                <li>{t("dashboard.limits.autoNewsletter")}</li>
              </ul>
            </Windows98ReadingPane>
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}
