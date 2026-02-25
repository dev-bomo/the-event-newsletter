import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Windows98ReadingPane from "./Windows98ReadingPane";

interface HelpWindowContentProps {
  onNavigateToPreferences?: () => void;
}

export default function HelpWindowContent({ onNavigateToPreferences }: HelpWindowContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <Windows98ReadingPane>
        <h3 className="text-xs font-bold text-black mb-2">
          {t("dashboard.howItWorks.title")}
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-xs text-black">
          <li>
            <Link
              to="/preferences"
              onClick={onNavigateToPreferences}
              className="text-black hover:underline"
            >
              {t("dashboard.howItWorks.step1")}
            </Link>
            <span className="text-black"> {" "}{t("dashboard.howItWorks.keywordsHint")}</span>
          </li>
          <li>{t("dashboard.howItWorks.step2")}</li>
          <li>{t("dashboard.howItWorks.step3")}</li>
          <li>{t("dashboard.howItWorks.step3b")}</li>
          <li>{t("dashboard.howItWorks.step4")}</li>
          <li>{t("dashboard.howItWorks.step5")}</li>
        </ol>
        <p className="text-xs text-black mt-4">{t("dashboard.howItWorks.step6")}</p>
      </Windows98ReadingPane>

      <Windows98ReadingPane>
        <h3 className="text-xs font-bold text-black mb-2">
          {t("dashboard.limits.title")}
        </h3>
        <ul className="list-disc list-inside space-y-1 text-xs text-black">
          <li>{t("dashboard.limits.newsletters")}</li>
          <li>{t("dashboard.limits.autoNewsletter")}</li>
        </ul>
      </Windows98ReadingPane>
    </div>
  );
}
