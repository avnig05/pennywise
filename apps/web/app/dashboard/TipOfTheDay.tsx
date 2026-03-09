import { getTip } from "@/lib/api/tip";

export default async function TipOfTheDay() {
  let tipText = "Connect to the API to load your personalized tip.";
  
  try {
    const tip = await getTip();
    if (tip && tip.tip_text) {
      tipText = tip.tip_text;
    }
  } catch (error) {
    // If API is unreachable or user hasn't completed profile, show default message
    console.error("Failed to load tip:", error);
  }

  return (
    <div className="mt-6 rounded-2xl border bg-[#FEF3E2] p-4">
      <div className="flex items-center gap-3 text-[#8B6914]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border">💡</span>
        <span className="font-medium">Tip of the day</span>
      </div>
      <p className="mt-2 text-sm text-[#8B6914]">{tipText}</p>
    </div>
  );
}

