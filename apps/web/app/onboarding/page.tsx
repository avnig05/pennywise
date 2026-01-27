"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileUpdate = {
  job_type: "w2" | "1099" | "unknown";
  state: string; // "CA" etc or "unknown"
  pay_frequency: "weekly" | "biweekly" | "semi-monthly" | "monthly" | "unknown";
  net_income_range: "lt_1500" | "1500_2500" | "2500_4000" | "gt_4000" | "unknown";
  rent_status: "rent" | "parents" | "dorm" | "other" | "unknown";
  debt_status: "none" | "student_loans" | "credit_card" | "both";
  credit_card_status: "no_card" | "have_not_used" | "use_sometimes" | "use_often";
  emergency_buffer_range: "zero" | "lt_500" | "500_2000" | "gt_2000";
  priority: "save" | "credit" | "debt" | "unsure";
};

const DEFAULT_FORM: ProfileUpdate = {
  job_type: "w2",
  state: "",
  pay_frequency: "biweekly",
  net_income_range: "1500_2500",
  rent_status: "unknown",
  debt_status: "none",
  credit_card_status: "no_card",
  emergency_buffer_range: "zero",
  priority: "save",
};

const US_STATES: { code: string; name: string }[] = [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "DC", name: "District of Columbia" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
  ];
  

export default function OnboardingPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  const [form, setForm] = useState<ProfileUpdate>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof ProfileUpdate>(key: K, value: ProfileUpdate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!form.state) {
        setError("Please select your state.");
        setSaving(false);
        return;
      }

    try {
      const res = await fetch(`${apiBase}/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`PUT /me failed (HTTP ${res.status})`);

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Onboarding</h1>
      <p className="mt-2 text-sm text-gray-600">
        Fill this once — we’ll use it to personalize your Week-1 plan.
      </p>

      <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4">
        {/* job_type */}
        <label className="block">
          <span className="font-medium">Job type</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.job_type}
            onChange={(e) => setField("job_type", e.target.value as ProfileUpdate["job_type"])}
          >
            <option value="w2">W-2 employee</option>
            <option value="1099">1099 contractor</option>
            <option value="unknown">Not sure</option>
          </select>
        </label>

        {/* state */}
        <label className="block">
            <span className="font-medium">State</span>
            <select
                className="mt-1 w-full rounded border p-2"
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                required
            >
                <option value="" disabled>
                Select your state…
                </option>

                {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                </option>
                ))}
            </select>
        </label>


        {/* pay_frequency */}
        <label className="block">
          <span className="font-medium">Pay frequency</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.pay_frequency}
            onChange={(e) =>
              setField("pay_frequency", e.target.value as ProfileUpdate["pay_frequency"])
            }
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="semi-monthly">Semi-monthly</option>
            <option value="monthly">Monthly</option>
            <option value="unknown">Not sure</option>
          </select>
        </label>

        {/* net_income_range */}
        <label className="block">
          <span className="font-medium">Monthly take-home (net)</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.net_income_range}
            onChange={(e) =>
              setField("net_income_range", e.target.value as ProfileUpdate["net_income_range"])
            }
          >
            <option value="lt_1500">&lt; $1,500</option>
            <option value="1500_2500">$1,500–$2,500</option>
            <option value="2500_4000">$2,500–$4,000</option>
            <option value="gt_4000">&gt; $4,000</option>
            <option value="unknown">Not sure</option>
          </select>
        </label>

        {/* rent_status */}
        <label className="block">
          <span className="font-medium">Living situation</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.rent_status}
            onChange={(e) =>
              setField("rent_status", e.target.value as ProfileUpdate["rent_status"])
            }
          >
            <option value="rent">Renting</option>
            <option value="parents">With parents</option>
            <option value="dorm">Dorm</option>
            <option value="other">Other</option>
            <option value="unknown">Prefer not to say</option>
          </select>
        </label>

        {/* debt_status */}
        <label className="block">
          <span className="font-medium">Debt</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.debt_status}
            onChange={(e) => setField("debt_status", e.target.value as ProfileUpdate["debt_status"])}
          >
            <option value="none">None</option>
            <option value="student_loans">Student loans</option>
            <option value="credit_card">Credit card balance</option>
            <option value="both">Both</option>
          </select>
        </label>

        {/* credit_card_status */}
        <label className="block">
          <span className="font-medium">Credit card usage</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.credit_card_status}
            onChange={(e) =>
              setField("credit_card_status", e.target.value as ProfileUpdate["credit_card_status"])
            }
          >
            <option value="no_card">No card</option>
            <option value="have_not_used">Have one, don’t use it</option>
            <option value="use_sometimes">Use sometimes</option>
            <option value="use_often">Use often</option>
          </select>
        </label>

        {/* emergency_buffer_range */}
        <label className="block">
          <span className="font-medium">Emergency buffer</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.emergency_buffer_range}
            onChange={(e) =>
              setField(
                "emergency_buffer_range",
                e.target.value as ProfileUpdate["emergency_buffer_range"]
              )
            }
          >
            <option value="zero">$0</option>
            <option value="lt_500">&lt; $500</option>
            <option value="500_2000">$500–$2,000</option>
            <option value="gt_2000">&gt; $2,000</option>
          </select>
        </label>

        {/* priority */}
        <label className="block">
          <span className="font-medium">Top priority</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={form.priority}
            onChange={(e) => setField("priority", e.target.value as ProfileUpdate["priority"])}
          >
            <option value="save">Build savings</option>
            <option value="credit">Improve credit</option>
            <option value="debt">Pay down debt</option>
            <option value="unsure">Not sure</option>
          </select>
        </label>

        {error && <p className="text-red-600">Error: {error}</p>}

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    </main>
  );
}
