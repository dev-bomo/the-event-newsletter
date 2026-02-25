import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Windows98Window from "./Windows98Window";
import Windows98ReadingPane from "./Windows98ReadingPane";

const STORAGE_KEY = "dislikeInfoSeen";

export function hasSeenDislikeInfo(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setDislikeInfoSeen(): void {
  localStorage.setItem(STORAGE_KEY, "1");
}

interface DislikeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDislikes?: () => void;
}

export default function DislikeInfoModal({
  isOpen,
  onClose,
  onOpenDislikes,
}: DislikeInfoModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={() => {
        setDislikeInfoSeen();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-w-xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Windows98Window
          title={t("hates.dislikeInfoModalTitle")}
          onClose={() => {
            setDislikeInfoSeen();
            onClose();
          }}
        >
          <div className="space-y-1">
            <Windows98ReadingPane>
              <div className="flex items-start gap-3">
                <img
                  src="/attention.png"
                  alt=""
                  width={96}
                  height={96}
                  className="flex-shrink-0"
                  aria-hidden
                />
                <div className="space-y-2 text-xs text-black">
                  <p className="font-bold">{t("hates.dislikeInfoLine1")}</p>
                  <ul className="list-disc list-inside space-y-1 ml-0">
                    <li>{t("hates.dislikeInfoLine2")}</li>
                    <li>{t("hates.dislikeInfoLine3")}</li>
                    <li>
                      {onOpenDislikes ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDislikeInfoSeen();
                            onClose();
                            onOpenDislikes();
                          }}
                          className="text-[#000080] hover:underline font-bold"
                        >
                          {t("hates.dislikeInfoLine4")}
                        </button>
                      ) : (
                        <Link
                          to="/hates"
                          onClick={() => {
                            setDislikeInfoSeen();
                            onClose();
                          }}
                          className="text-[#000080] hover:underline font-bold"
                        >
                          {t("hates.dislikeInfoLine4")}
                        </Link>
                      )}
                    </li>
                  </ul>
                  <p className="italic">{t("hates.dislikeInfoLine5")}</p>
                </div>
              </div>
            </Windows98ReadingPane>
          </div>
        </Windows98Window>
      </div>
    </div>
  );
}
