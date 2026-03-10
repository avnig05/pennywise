'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, BarChart3, HelpCircle, MessageCircle } from 'lucide-react';

const features = [
  {
    name: 'Personalized Learning',
    icon: Target,
    title: 'A learning path, just for you.',
    description: "Your journey starts with a quick profile setup. We build a personalized curriculum with bite-sized lessons that focuses on what's most relevant to your specific financial goals.",
  },
  {
    name: 'AI Chatbot',
    icon: MessageCircle,
    title: 'Your personal finance expert.',
    description: 'Ask questions, get instant explanations, and explore complex financial topics in a conversational way. Our AI is here to help you understand money, anytime.',
  },
  {
    name: 'Knowledge Quizzes',
    icon: HelpCircle,
    title: 'Test your understanding.',
    description: 'Solidify your knowledge with interactive quizzes. Track your learning and identify areas where you can grow.',
  },
  {
    name: 'Progress Tracking',
    icon: BarChart3,
    title: 'Watch your knowledge grow.',
    description: 'Visualize your progress, celebrate your achievements, and stay motivated on your path to financial literacy.',
  },
];

export default function BetterUseCases() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="w-full py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a3c34] mb-6 tracking-tight">
            A new way to learn finance.
          </h2>
          <p className="text-lg text-[#4a635d] max-w-2xl mx-auto opacity-80">
            Pennywise is built on a simple premise: financial education should be accessible, engaging, and tailored to you.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-stretch">
          {/* Sidebar Tabs */}
          <div className="md:col-span-4 flex flex-col gap-3">
            {features.map((feature, index) => (
              <button
                key={feature.name}
                onClick={() => setActiveTab(index)}
                className={`group relative w-full text-left px-6 py-5 rounded-2xl transition-all duration-300 border ${
                  activeTab === index
                    ? 'border-[#4d7c71]/20 bg-white shadow-xl shadow-emerald-900/5'
                    : 'border-transparent hover:bg-[#f8faf9]'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-2 rounded-lg transition-colors ${
                    activeTab === index ? 'bg-[#4d7c71] text-white' : 'bg-[#f0f4f2] text-[#4d7c71]'
                  }`}>
                    <feature.icon size={18} />
                  </div>
                  <span className={`font-bold tracking-tight ${
                    activeTab === index ? 'text-[#1a3c34]' : 'text-[#4a635d]/70'
                  }`}>
                    {feature.name}
                  </span>
                </div>
                
                {activeTab === index && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 rounded-2xl ring-2 ring-[#4d7c71]/10 -z-10"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Main Display Area */}
          <div className="md:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="h-full bg-[#fcfdfc] border border-[#eef2f0] p-10 md:p-16 rounded-[2.5rem] shadow-sm flex flex-col justify-center"
              >
                 <h3 className="text-4xl font-bold text-[#1a3c34] mb-6 leading-[1.1]">
                   {features[activeTab].title}
                </h3>
                
                <p className="text-xl text-[#4a635d] leading-relaxed max-w-xl">
                  {features[activeTab].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}