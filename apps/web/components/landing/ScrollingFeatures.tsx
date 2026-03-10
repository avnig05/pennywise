
'use client';

import {
  Lightbulb,
  BarChart3,
  UserCheck,
  GraduationCap,
  CreditCard,
  Wallet,
  TrendingUp,
  Layers,
} from 'lucide-react';

const features = [
  { name: 'Personalized Learning', icon: Lightbulb },
  { name: 'Track Progress', icon: BarChart3 },
  { name: 'Expert Guidance', icon: UserCheck },
  { name: 'Student Loans', icon: GraduationCap },
  { name: 'Credit Cards', icon: CreditCard },
  { name: 'Budgeting', icon: Wallet },
  { name: 'Building Credit', icon: TrendingUp },
  { name: 'Bite-sized Lessons', icon: Layers },
];

// Duplicate the array for a seamless loop
const allFeatures = [...features, ...features];

export default function ScrollingFeatures() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-[#1a3c34] tracking-tight">
          All your finances. One platform.
        </h2>
      </div>
      <div className="w-full inline-flex flex-nowrap">
        <ul className="flex items-center justify-center md:justify-start [&_li]:mx-4 animate-scroll">
          {allFeatures.map((feature, index) => (
            <li key={index} className="flex-shrink-0 bg-white rounded-2xl p-8 shadow-sm w-64 border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[#e8f0e8] flex items-center justify-center mb-5">
                <feature.icon className="text-[#5a7c65]" size={24} />
              </div>
              <h3 className="font-serif text-lg font-medium text-[#2d5755]">{feature.name}</h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
