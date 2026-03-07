"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import { StateCombobox } from "./StateCombobox";
import type {
  AgeRange,
  CreditCardStatus,
  DebtStatus,
  EmergencyBufferRange,
  JobType,
  NetIncomeRange,
  PayFrequency,
  Priority,
  ProfileUpdate,
  RentStatus,
} from "../../types/profile";
import { updateProfile } from "../../lib/api/profile";

type FormState = ProfileUpdate & { interests: string[] };

const AGE_OPTIONS: RadioGroupOption<AgeRange>[] = [
  { value: "lt_18", label: "Under 18" },
  { value: "18_24", label: "18-24" },
  { value: "25_34", label: "25-34" },
  { value: "35_44", label: "35-44" },
  { value: "45_54", label: "45-54" },
  { value: "55_64", label: "55-64" },
  { value: "65_plus", label: "65+" },
  { value: "unknown", label: "Prefer not to say" },
];

const INCOME_OPTIONS: RadioGroupOption<NetIncomeRange>[] = [
  { value: "lt_1500", label: "Less than $1,500/month" },
  { value: "1500_2500", label: "$1,500-$2,500/month" },
  { value: "2500_4000", label: "$2,500-$4,000/month" },
  { value: "gt_4000", label: "More than $4,000/month" },
  { value: "unknown", label: "Prefer not to say" },
];

const JOB_TYPE_OPTIONS: RadioGroupOption<JobType>[] = [
  { value: "w2", label: "W-2 employee" },
  { value: "1099", label: "1099 / contractor" },
  { value: "unknown", label: "Not sure" },
];

const PAY_FREQUENCY_OPTIONS: RadioGroupOption<PayFrequency>[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every two weeks" },
  { value: "semi-monthly", label: "Twice a month" },
  { value: "monthly", label: "Monthly" },
  { value: "unknown", label: "Not sure" },
];

const RENT_STATUS_OPTIONS: RadioGroupOption<RentStatus>[] = [
  { value: "rent", label: "Renting" },
  { value: "parents", label: "Living with parents" },
  { value: "dorm", label: "Dorm or campus housing" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Prefer not to say" },
];

const DEBT_STATUS_OPTIONS: RadioGroupOption<DebtStatus>[] = [
  { value: "none", label: "No debt" },
  { value: "student_loans", label: "Student loans" },
  { value: "credit_card", label: "Credit card debt" },
  { value: "both", label: "Student loans + credit cards" },
];

const CREDIT_CARD_STATUS_OPTIONS: RadioGroupOption<CreditCardStatus>[] = [
  { value: "no_card", label: "No credit card" },
  { value: "have_not_used", label: "Have one, don't use it" },
  { value: "use_sometimes", label: "Use sometimes" },
  { value: "use_often", label: "Use often" },
];

const EMERGENCY_BUFFER_OPTIONS: RadioGroupOption<EmergencyBufferRange>[] = [
  { value: "zero", label: "$0 saved" },
  { value: "lt_500", label: "Less than $500" },
  { value: "500_2000", label: "$500-$2,000" },
  { value: "gt_2000", label: "More than $2,000" },
];

const PRIORITY_OPTIONS: RadioGroupOption<Priority>[] = [
  { value: "save", label: "Build savings" },
  { value: "credit", label: "Improve credit" },
  { value: "debt", label: "Pay down debt" },
  { value: "unsure", label: "Not sure yet" },
];

const INTEREST_OPTIONS = [
  "Budgeting",
  "Saving",
  "Credit scores",
  "Paying off debt",
  "Investing basics",
  "Taxes",
  "Side income",
];


export default function OnboardingForm() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<FormState>({
    age_range: null,
    state: null,
    job_type: null,
    pay_frequency: null,
    net_income_range: null,
    rent_status: null,
    debt_status: null,
    credit_card_status: null,
    emergency_buffer_range: null,
    priority: null,
    interests: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      {
        id: "age",
        title: "What is your age range?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="age_range"
            value={formState.age_range}
            options={AGE_OPTIONS}
            onChange={(value) => setFormState((prev) => ({ ...prev, age_range: value }))}
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ age_range: v }) : undefined}
          />
        ),
      },
      {
        id: "job_type",
        title: "Which best describes your work?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="job_type"
            value={formState.job_type}
            options={JOB_TYPE_OPTIONS}
            onChange={(value) => setFormState((prev) => ({ ...prev, job_type: value }))}
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ job_type: v }) : undefined}
          />
        ),
      },
      {
        id: "state",
        title: "Which state do you live in?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <StateCombobox
            value={formState.state ?? null}
            onChange={(value) =>
              setFormState((prev) => ({ ...prev, state: value }))
            }
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ state: v }) : undefined}
          />
        ),
      },
      {
        id: "pay_frequency",
        title: "How often do you get paid?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="pay_frequency"
            value={formState.pay_frequency}
            options={PAY_FREQUENCY_OPTIONS}
            onChange={(value) => setFormState((prev) => ({ ...prev, pay_frequency: value }))}
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ pay_frequency: v }) : undefined}
          />
        ),
      },
      {
        id: "income",
        title: "What is your monthly take-home income?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="net_income_range"
            value={formState.net_income_range}
            options={INCOME_OPTIONS}
            onChange={(value) => setFormState((prev) => ({ ...prev, net_income_range: value }))}
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ net_income_range: v }) : undefined}
          />
        ),
      },
      {
        id: "rent_status",
        title: "What is your housing situation?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="rent_status"
            value={formState.rent_status}
            options={RENT_STATUS_OPTIONS}
            onChange={(value) => setFormState((prev) => ({ ...prev, rent_status: value }))}
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ rent_status: v }) : undefined}
          />
        ),
      },
      {
        id: "debt_status",
        title: "Do you currently have debt?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="debt_status"
            value={formState.debt_status}
            options={DEBT_STATUS_OPTIONS}
            onChange={(value) => setFormState((prev) => ({ ...prev, debt_status: value }))}
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ debt_status: v }) : undefined}
          />
        ),
      },
      {
        id: "credit_card_status",
        title: "How do you use credit cards?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="credit_card_status"
            value={formState.credit_card_status}
            options={CREDIT_CARD_STATUS_OPTIONS}
            onChange={(value) =>
              setFormState((prev) => ({ ...prev, credit_card_status: value }))
            }
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ credit_card_status: v }) : undefined}
          />
        ),
      },
      {
        id: "emergency_buffer_range",
        title: "How much do you have in emergency savings?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="emergency_buffer_range"
            value={formState.emergency_buffer_range}
            options={EMERGENCY_BUFFER_OPTIONS}
            onChange={(value) =>
              setFormState((prev) => ({ ...prev, emergency_buffer_range: value }))
            }
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ emergency_buffer_range: v }) : undefined}
          />
        ),
      },
      {
        id: "priority",
        title: "What is your top financial priority?",
        body: (onSelectAndNext?: (overrides: Partial<FormState>) => void) => (
          <RadioGroup
            name="priority"
            value={formState.priority}
            options={PRIORITY_OPTIONS}
            onChange={(value) => setFormState((prev) => ({ ...prev, priority: value }))}
            onSelectAndNext={onSelectAndNext ? (v) => onSelectAndNext({ priority: v }) : undefined}
          />
        ),
      },
      {
        id: "interests",
        title: "What topics are you interested in learning?",
        body: () => (
          <CheckboxGroup
            options={INTEREST_OPTIONS}
            value={formState.interests}
            onChange={(value) => setFormState((prev) => ({ ...prev, interests: value }))}
          />
        ),
      },
    ],
    [formState]
  );

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;

  const validateStep = (state: FormState = formState) => {
    switch (currentStep.id) {
      case "age":
        return state.age_range ? null : "Please select an age range.";
      case "job_type":
        return state.job_type ? null : "Please select a job type.";
      case "state":
        return state.state ? null : "Please choose a state.";
      case "pay_frequency":
        return state.pay_frequency ? null : "Please choose a pay frequency.";
      case "income":
        return state.net_income_range ? null : "Please choose an income range.";
      case "rent_status":
        return state.rent_status ? null : "Please select a housing option.";
      case "debt_status":
        return state.debt_status ? null : "Please select a debt option.";
      case "credit_card_status":
        return state.credit_card_status ? null : "Please select a credit card option.";
      case "emergency_buffer_range":
        return state.emergency_buffer_range
          ? null
          : "Please select an emergency savings range.";
      case "priority":
        return state.priority ? null : "Please select a priority.";
      case "interests":
        return state.interests.length > 0
          ? null
          : "Please select at least one interest.";
      default:
        return null;
    }
  };

  const persist = async (state: FormState = formState) => {
    if (!state.state) {
      return true;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile(state);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save answers";
      setError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async (overrides?: Partial<FormState>) => {
    if (isLastStep) return;
    const stateToUse = overrides ? { ...formState, ...overrides } : formState;
    const validationMessage = validateStep(stateToUse);
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }
    setValidationError(null);
    if (overrides) setFormState((prev) => ({ ...prev, ...overrides }));
    const ok = await persist(stateToUse);
    if (ok) {
      setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handleBack = () => {
    setValidationError(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        const validationMessage = validateStep();
        if (validationMessage) {
          setValidationError(validationMessage);
          return;
        }
        setValidationError(null);
        const ok = await persist();
        if (ok) {
          document.cookie = `onboarding-complete=true; path=/; max-age=${60 * 60 * 24 * 30}`;
          router.push("/dashboard");
        }
      }}
    >
      <StepIndicator currentStep={stepIndex} totalSteps={totalSteps} />
      <div>
        <h2 className="text-lg font-semibold">{currentStep.title}</h2>
        {currentStep.body(isLastStep ? undefined : handleNext)}
      </div>
      {validationError ? (
        <p className="text-sm text-red-600">{validationError}</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="cursor-pointer rounded-md border px-4 py-2 text-sm"
          onClick={handleBack}
          disabled={stepIndex === 0}
        >
          Back
        </button>
        <button
          type={isLastStep ? "submit" : "button"}
          className="cursor-pointer rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          onClick={isLastStep ? undefined : () => void handleNext()}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : isLastStep ? "Finish" : "Next"}
        </button>
      </div>
    </form>
  );
}

type RadioGroupOption<T extends string> = {
  value: T;
  label: string;
};

type RadioGroupProps<T extends string> = {
  name: string;
  value: T | null | undefined;
  options: RadioGroupOption<T>[];
  onChange: (value: T) => void;
  onSelectAndNext?: (value: T) => void;
};

function RadioGroup<T extends string>({ name, value, options, onChange, onSelectAndNext }: RadioGroupProps<T>) {
  const handleChange = (optionValue: T) => {
    onChange(optionValue);
    onSelectAndNext?.(optionValue);
  };
  return (
    <div className="mt-4 space-y-3">
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

type CheckboxGroupProps = {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
};

function CheckboxGroup({ value, options, onChange }: CheckboxGroupProps) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const checked = value.includes(option);
        return (
          <label key={option} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              value={option}
              checked={checked}
              onChange={() => {
                if (checked) {
                  onChange(value.filter((item) => item !== option));
                } else {
                  onChange([...value, option]);
                }
              }}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}
