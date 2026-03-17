import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Windows98Window from "./Windows98Window";

interface LoadingStep {
  id: string;
  labelKey: string;
}

const STEPS: LoadingStep[] = [
  { id: "planning", labelKey: "loading.planning" },
  { id: "searching", labelKey: "loading.searching" },
  { id: "merging", labelKey: "loading.merging" },
  { id: "finalizing", labelKey: "loading.finalizing" },
];

const SEGMENTS = 16;
const WINDOW_WIDTH = 320;
const WINDOW_HEIGHT = 180;

function getCenteredPosition() {
  return {
    x: Math.max(0, (window.innerWidth - WINDOW_WIDTH) / 2),
    y: Math.max(0, (window.innerHeight - WINDOW_HEIGHT) / 2),
  };
}

interface LoadingOverlayProps {
  isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [position, setPosition] = useState(getCenteredPosition);

  const updatePosition = useCallback(() => {
    setPosition(getCenteredPosition());
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isVisible, updatePosition]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0);
      setIsFading(false);
      return;
    }

    const stepDurations = [6000, 16000, 8000];
    let timeoutId: ReturnType<typeof setTimeout>;

    const advanceStep = (stepIndex: number) => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentStepIndex(stepIndex);
        setIsFading(false);
      }, 300);
      if (stepIndex < STEPS.length - 1) {
        timeoutId = setTimeout(
          () => advanceStep(stepIndex + 1),
          stepDurations[stepIndex] || 3000
        );
      }
    };

    timeoutId = setTimeout(() => advanceStep(1), stepDurations[0] || 6000);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;
  const filledSegments = Math.round((progressPercent / 100) * SEGMENTS);
  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <Windows98Window
        title={t("loading.newsletter")}
        controlledPosition={position}
        controlledSize={{ width: WINDOW_WIDTH, height: WINDOW_HEIGHT }}
        onClose={() => {}}
        controlledZIndex={101}
      >
        <div className="p-4 flex flex-col items-center gap-4">
          <p
            className={`text-sm text-black font-normal transition-opacity duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {t(currentStep.labelKey)}...
          </p>

          {/* Recessed progress bar - same style as app windows */}
          <div
            className="w-full h-5 flex gap-px p-0.5 border-2 border-t-[#808080] border-l-[#808080] border-r-[#fff] border-b-[#fff] bg-[#c0c0c0]"
            style={{ boxShadow: "inset 2px 2px 2px rgba(0,0,0,0.15)" }}
          >
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <div
                key={i}
                className="flex-1 min-w-0 h-full"
                style={{ backgroundColor: i < filledSegments ? "#000080" : "#c0c0c0" }}
              />
            ))}
          </div>
        </div>
      </Windows98Window>
    </div>
  );
}
