import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import Windows98Window from "../components/Windows98Window";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto">
        <Windows98Window title={t("privacy.title")}>
          <div className="p-4 space-y-4">
            <div className="text-xs text-black space-y-2">
              <p>{t("privacy.lastUpdated")}</p>
              <h3 className="font-bold text-sm">{t("privacy.dataWeCollect")}</h3>
              <p>{t("privacy.dataWeCollectContent")}</p>
              <h3 className="font-bold text-sm">{t("privacy.howWeUseData")}</h3>
              <p>{t("privacy.howWeUseDataContent")}</p>
              <h3 className="font-bold text-sm">{t("privacy.preferences")}</h3>
              <p>{t("privacy.preferencesContent")}</p>
              <h3 className="font-bold text-sm">{t("privacy.noSharing")}</h3>
              <p>{t("privacy.noSharingContent")}</p>
              <h3 className="font-bold text-sm">{t("privacy.payment")}</h3>
              <p>{t("privacy.paymentContent")}</p>
              <h3 className="font-bold text-sm">{t("privacy.contact")}</h3>
              <p>{t("privacy.contactContent")}</p>
            </div>
            <div className="pt-4 border-t border-[#808080]">
              <p className="text-xs font-bold text-black">
                © {new Date().getFullYear()} Good Software
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-block win98-button mt-4"
            >
              ← {t("common.back")}
            </Link>
          </div>
        </Windows98Window>
      </div>
    </Layout>
  );
}
