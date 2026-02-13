import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Layout from "../components/Layout";
import Windows98Window from "../components/Windows98Window";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 max-w-3xl mx-auto">
        <Windows98Window title={t("terms.title")}>
          <div className="p-4 space-y-4">
            <div className="text-xs text-black space-y-2">
              <p>{t("terms.lastUpdated")}</p>
              <h3 className="font-bold text-sm">{t("terms.service")}</h3>
              <p>{t("terms.serviceContent")}</p>
              <h3 className="font-bold text-sm">{t("terms.acceptance")}</h3>
              <p>{t("terms.acceptanceContent")}</p>
              <h3 className="font-bold text-sm">{t("terms.contact")}</h3>
              <p>{t("terms.contactContent")}</p>
            </div>
            <div className="pt-4 border-t border-[#808080]">
              <p className="text-xs font-bold text-black">
                © {new Date().getFullYear()} Good Software
              </p>
            </div>
            <Link
              to="/newsletters"
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
