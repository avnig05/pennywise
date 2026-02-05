type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
      <span>
        Step {currentStep + 1} of {totalSteps}
      </span>
      <div className="ml-4 flex flex-1 gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={`h-1 w-full rounded-full ${
              index <= currentStep ? "bg-[var(--color-primary)]" : "bg-[var(--border-color)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
