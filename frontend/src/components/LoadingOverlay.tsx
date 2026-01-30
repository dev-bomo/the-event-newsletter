import { useState, useEffect } from "react";

interface LoadingStep {
  id: string;
  label: string;
  description: string;
}

const steps: LoadingStep[] = [
  {
    id: "planning",
    label: "Planning",
    description: "Generating the list of sources to look through...",
  },
  {
    id: "searching",
    label: "Searching",
    description: "Crawling sources and finding events...",
  },
  {
    id: "merging",
    label: "Merging",
    description: "Scoring and deduplicating events...",
  },
  {
    id: "finalizing",
    label: "Finalizing",
    description: "Preparing your personalized newsletter...",
  },
];

interface LoadingOverlayProps {
  isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0);
      setIsFading(false);
      return;
    }

    // Cycle through first 3 steps with doubled durations
    // Planning: 6s, Searching: 16s, Merging: 8s
    // Finalizing stays until work is done (isVisible becomes false)
    const stepDurations = [6000, 16000, 8000];
    let timeoutId: ReturnType<typeof setTimeout>;

    const advanceStep = (stepIndex: number) => {
      // Fade out
      setIsFading(true);
      setTimeout(() => {
        setCurrentStepIndex(stepIndex);
        setIsFading(false);
      }, 300); // Fade duration
      
      // If we've reached Finalizing (index 3), stop advancing
      // It will stay on Finalizing until isVisible becomes false
      if (stepIndex < steps.length - 1) {
        timeoutId = setTimeout(
          () => advanceStep(stepIndex + 1),
          stepDurations[stepIndex] || 3000
        );
      }
    };

    // Start with first step
    timeoutId = setTimeout(() => advanceStep(1), stepDurations[0] || 6000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] p-4 max-w-md w-full mx-4">
        {/* Windows 98 Title Bar */}
        <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between mb-4">
          <span className="text-xs font-bold">Generating Newsletter</span>
        </div>

        {/* Windows 98 Style Spinner/Progress */}
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-8 bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-1">
            <div className="h-full bg-[#000080] relative overflow-hidden">
              {/* Animated progress bar effect */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{ 
                  animation: 'shimmer 1.5s ease-in-out infinite',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                  backgroundSize: '200% 100%'
                }}
              ></div>
              {/* Progress indicator blocks */}
              <div className="h-full flex items-center justify-center">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 bg-white ${
                        Math.floor((currentStepIndex / steps.length) * 5) > i ? 'opacity-100' : 'opacity-50'
                      }`}
                      style={{
                        animation: `pulse 1s ease-in-out infinite ${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator with fade animation */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3
              className={`text-xs font-bold text-black transition-opacity duration-300 ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              {currentStep.label}
            </h3>
            <span className="text-xs font-bold text-black">
              {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
          <p
            className={`text-xs text-black transition-opacity duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {currentStep.description}
          </p>
        </div>

        {/* Progress indicator blocks (Windows 98 style) */}
        <div className="flex justify-center gap-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-4 w-4 transition-all duration-300 ${
                index === currentStepIndex
                  ? "bg-[#000080] border-2 border-[#000080]"
                  : index < currentStepIndex
                  ? "bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff]"
                  : "bg-[#c0c0c0] border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] opacity-50"
              }`}
            />
          ))}
        </div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

