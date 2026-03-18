import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import Windows98Window from "../components/Windows98Window";
import { useAuthStore } from "../store/authStore";

const PLANS = [
  { id: "monthly", price: "$2.9", periodKey: "subscribe.monthly", badgeKey: "subscribe.monthlyTag" },
  { id: "6mo", price: "$15", periodKey: "subscribe.6mo", badgeKey: "subscribe.save6mo" },
  { id: "yearly", price: "$24", periodKey: "subscribe.yearly", badgeKey: "subscribe.saveYear" },
] as const;

export default function Pricing() {
  const { t } = useTranslation();
  const { token } = useAuthStore();

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Windows98Window title={t("pricing.title")} className="!border" fitContent>
            <div className="bg-white border border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-4 md:p-6 space-y-6">
              <div className="text-center space-y-3">
                <p className="text-sm font-bold text-black">{t("pricing.heading")}</p>
                <p className="text-xs text-[#404040]">{t("pricing.subheading")}</p>
                <div className="flex items-center justify-center gap-3 text-xs">
                  <Link to="/" className="text-[#000080] hover:underline">
                    {t("pricing.backHome")}
                  </Link>
                  <span className="text-[#808080]">|</span>
                  {token ? (
                    <Link to="/subscribe" className="text-[#000080] hover:underline">
                      {t("pricing.goToSubscribe")}
                    </Link>
                  ) : (
                    <Link to="/register" className="text-[#000080] hover:underline">
                      {t("pricing.createAccount")}
                    </Link>
                  )}
                </div>
              </div>

              <hr className="border-0 h-px bg-[#c0c0c0]" />

              <div className="space-y-3">
                <div className="bg-[#000080] text-white text-xs font-bold px-2 py-1 inline-block">
                  {t("subscribe.choosePlan")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-[#f0f0f0] border border-[#c0c0c0] p-4 flex flex-col items-center text-center"
                    >
                      <span
                        className={`text-white text-xs font-bold px-2 py-0.5 mb-2 ${
                          plan.id === "6mo" ? "bg-[#800000]" : "bg-[#000080]"
                        }`}
                      >
                        {t(plan.badgeKey)}
                      </span>
                      <p className="text-lg font-bold text-black mb-1">{plan.price}</p>
                      <p className="text-xs text-[#404040] mb-4">{t(plan.periodKey)}</p>
                      {token ? (
                        <Link to="/subscribe" className="win98-button w-full inline-block text-center">
                          {t("subscribe.cta")}
                        </Link>
                      ) : (
                        <Link to="/register" className="win98-button w-full inline-block text-center">
                          {t("pricing.ctaCreateAccount")}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-0 h-px bg-[#c0c0c0]" />

              <p className="text-xs text-[#404040] text-center">{t("subscribe.securePayment")}</p>
            </div>
          </Windows98Window>
        </div>
      </div>
    </Layout>
  );
}

