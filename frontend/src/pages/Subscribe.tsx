import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import Windows98Window from "../components/Windows98Window";
import logo1line from "../assets/logo1line.png";
import logo3lines from "../assets/logo3lines.png";
import { useAuthStore } from "../store/authStore";
import { openPaddleCheckout } from "../lib/paddle";

const PLANS = [
  { id: "monthly", price: "$2.9", periodKey: "subscribe.monthly", badgeKey: "subscribe.monthlyTag" },
  { id: "6mo", price: "$15", periodKey: "subscribe.6mo", badgeKey: "subscribe.save6mo" },
  { id: "yearly", price: "$24", periodKey: "subscribe.yearly", badgeKey: "subscribe.saveYear" },
] as const;

export default function Subscribe() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const handleSelectPlan = async (planId: string) => {
    await openPaddleCheckout(planId, user?.email ?? "", user?.id ?? "");
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Windows98Window title={t("subscribe.title")} className="!border">
            <div className="bg-white border border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-4 md:p-6 space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="flex justify-center mb-4">
                  <img
                    src={logo3lines}
                    alt="The Event Newsletter"
                    className="h-24 w-auto md:hidden"
                  />
                  <img
                    src={logo1line}
                    alt="The Event Newsletter"
                    className="h-14 w-auto hidden md:block"
                  />
                </div>
                <p className="text-sm font-bold text-black">
                  {t("subscribe.heading")}
                </p>
                <p className="text-xs text-[#404040]">
                  {t("subscribe.subheading")}
                </p>
                <Link
                  to="/newsletters"
                  className="text-xs text-[#000080] hover:underline"
                >
                  {t("subscribe.backToNewsletters")}
                </Link>
              </div>

              <hr className="border-0 h-px bg-[#c0c0c0]" />

              {/* Pricing */}
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
                      <span className="bg-[#000080] text-white text-xs font-bold px-2 py-0.5 mb-2">
                        {t(plan.badgeKey)}
                      </span>
                      <p className="text-lg font-bold text-black mb-1">
                        {plan.price}
                      </p>
                      <p className="text-xs text-[#404040] mb-4">
                        {t(plan.periodKey)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan.id)}
                        className="win98-button w-full"
                      >
                        {t("subscribe.cta")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-0 h-px bg-[#c0c0c0]" />

              <p className="text-xs text-[#404040] text-center">
                {t("subscribe.securePayment")}
              </p>
            </div>
          </Windows98Window>
        </div>
      </div>
    </Layout>
  );
}
