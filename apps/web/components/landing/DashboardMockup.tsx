
import Plant from "./Plant";

export default function DashboardMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white/30 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/40">
      <div className="relative h-96 rounded-xl flex items-center justify-center">
        <div className="text-white/50">Dashboard Mockup</div>
      </div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32">
        <Plant />
      </div>
    </div>
  );
}
