type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export default function StepIndicator({
  currentStep,
  totalSteps,
}: StepIndicatorProps) {
  return (
    <div className="rounded-[18px] border border-white/45 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#173b37]/65">
        <span>Onboarding</span>
        <span>
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={`h-2 w-full rounded-full transition ${
              index <= currentStep ? "bg-[#012825]" : "bg-[#d7dfdc]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}