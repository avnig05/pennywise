import { Target, BarChart3, Sparkles, LucideIcon } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Personalized Learning",
    description: "Content tailored to your interests, goals, and financial situation.",
    blobPath: "M38.7,-51.7C49.8,-43.1,58.4,-31.7,62.1,-18.5C65.8,-5.4,64.6,9.5,58.9,22.6C53.2,35.7,43,47.1,30.3,54.1C17.7,61.1,2.5,63.7,-11.9,61C-26.3,58.3,-40,50.3,-49.8,38.8C-59.6,27.3,-65.4,12.3,-64.1,-2.3C-62.8,-16.9,-54.3,-31.1,-42.6,-39.8C-30.8,-48.5,-15.4,-51.7,-0.4,-51.2C14.7,-50.7,27.5,-60.3,38.7,-51.7Z",
    blobColor: "text-[#c2cfcc]",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description: "See your knowledge grow with clear milestones and actionable insights.",
    blobPath: "M43.2,-57.4C54.1,-48.3,60,-32.8,61.2,-17.8C62.4,-2.8,59,11.8,51.8,24.1C44.6,36.5,33.5,46.6,20.6,52.9C7.7,59.3,-7,61.9,-20.1,58.2C-33.2,54.6,-44.7,44.7,-52.8,32.6C-60.9,20.5,-65.6,6.3,-64.1,-7.4C-62.5,-21.2,-54.8,-34.5,-43.5,-43.5C-32.2,-52.5,-17.4,-57.3,-1.3,-55.6C14.8,-53.9,29.7,-45.8,43.2,-57.4Z",
    blobColor: "text-[#dcd1ba]",
  },
  {
    icon: Sparkles,
    title: "Expert Guidance",
    description: "Curated content from financial experts, simplified for real life.",
    blobPath: "M45.7,-60.1C58.2,-51.5,66.7,-36.1,69.5,-20.2C72.3,-4.2,69.3,12.2,62,26C54.7,39.7,43.1,50.8,29.9,57.5C16.6,64.1,1.7,66.3,-13.1,64.2C-27.9,62.1,-42.6,55.7,-53.8,45.2C-65,34.6,-72.7,19.9,-73.4,4.7C-74.1,-10.5,-67.7,-26.2,-57.4,-37.2C-47.1,-48.2,-33,-54.6,-19.1,-59.6C-5.1,-64.5,8.8,-68.1,23.3,-67.2C31.5,-66.7,39,-64.3,45.7,-60.1Z",
    blobColor: "text-[#c2cfcc]",
  },
];

type FeatureBlobProps = {
  path: string;
  colorClass: string;
  Icon: LucideIcon;
};

const FeatureBlob = ({ path, colorClass, Icon }: FeatureBlobProps) => (
  <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
    <div className={`absolute inset-0 ${colorClass} transition-transform duration-700 hover:scale-110 hover:rotate-3 opacity-70`}>
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d={path} transform="translate(100 100)" />
      </svg>
    </div>
    <Icon className="text-[#1a302b] relative z-10" size={32} strokeWidth={1.5} />
  </div>
);

export default function LandingFeatures() {
  return (
    <section className="relative w-full pt-28 pb-48 bg-white overflow-hidden flex flex-col items-center">
      <div className="max-w-6xl w-full px-6 relative z-10">
        
        {/* Title Section */}
        <div className="text-center mb-20">
          <h2 className="font-serif text-5xl md:text-6xl font-serif text-[#a18a5e] mb-4">
            Everything you need.
          </h2>
          <h2 className="font-serif text-5xl md:text-6xl font-bold text-[#1a302b] tracking-tight">
            Nothing you don&apos;t.
          </h2>
        </div>

        {/* The Pebble Container */}
        <div className="bg-[#f6eee3] rounded-[5rem] md:rounded-[7rem] pt-16 md:pt-24 px-10 md:px-24 pb-20 md:pb-28 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
          <div className="grid md:grid-cols-3 gap-20 md:gap-12">
            {features.map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <FeatureBlob 
                  path={feature.blobPath} 
                  colorClass={feature.blobColor} 
                  Icon={feature.icon} 
                />
                <h3 className="font-serif text-2xl font-bold text-[#1a302b] mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="font-sans text-[#4b5e5a] text-lg leading-relaxed max-w-[280px]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Wave - Purely visual transition */}
      <div className="absolute bottom-0 left-0 w-full leading-[0] z-0 overflow-hidden">
        <svg 
          viewBox="0 0 1440 320" 
          className="relative block w-full h-[150px] md:h-[200px]"
          preserveAspectRatio="none"
        >
          <path 
            fill="#f6eee3" 
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </section>
  );
}