import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Windows98Window from "./Windows98Window";
import Windows98ReadingPane from "./Windows98ReadingPane";

interface HowItWorksOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksOverlay({
  isOpen,
  onClose,
}: HowItWorksOverlayProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-w-xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Windows98Window
          title={t("dashboard.howItWorks.title")}
          onClose={onClose}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <Windows98ReadingPane>
              <h3 className="text-xs font-bold text-black mb-2">
                {t("dashboard.howItWorks.title")}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-black">
                <li>
                  <Link
                    to="/preferences"
                    onClick={onClose}
                    className="text-[#000080] hover:underline font-bold"
                  >
                    {t("dashboard.howItWorks.step1")}
                  </Link>
                  <span className="text-[#000080] font-bold">
                    {" "}
                    {t("dashboard.howItWorks.keywordsHint")}
                  </span>
                </li>
                <li>{t("dashboard.howItWorks.step2")}</li>
                <li>{t("dashboard.howItWorks.step3")}</li>
                <li>{t("dashboard.howItWorks.step4")}</li>
                <li>{t("dashboard.howItWorks.step5")}</li>
                <li>{t("dashboard.howItWorks.step6")}</li>
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
    </div>
  );
}
