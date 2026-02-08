import { Target, TrendingUp, Sparkles } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Personalized Learning",
    description: "Content tailored to your interests, goals, and financial situation.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "See your financial knowledge grow with clear milestones and insights.",
  },
  {
    icon: Sparkles,
    title: "Expert Guidance",
    description: "Curated content from financial experts, simplified for real life.",
  },
];

export default function LandingFeatures() {
  return (
    <section className="w-full py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Everything you need.
          </h2>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800">
            Nothing you don&apos;t.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <feature.icon className="text-sage-500" size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
