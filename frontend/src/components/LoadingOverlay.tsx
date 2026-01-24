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
    let timeoutId: NodeJS.Timeout;

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
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Animated spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Step indicator with fade animation */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3
              className={`text-lg font-semibold text-gray-900 transition-opacity duration-300 ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
            >
              {currentStep.label}
            </h3>
            <span className="text-sm text-gray-500">
              {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
          <p
            className={`text-sm text-gray-600 transition-opacity duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {currentStep.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentStepIndex
                  ? "bg-indigo-600 w-8"
                  : index < currentStepIndex
                  ? "bg-indigo-300"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

