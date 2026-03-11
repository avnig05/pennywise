import { type ReactNode } from "react";
import Blob from "./Blob";
import Wave from "./Wave";
import Image from "next/image";
import Link from "next/link";

const Coin = ({ size, color, detailColor, rotation, className, children }: {
  size: string;
  color: string;
  detailColor: string;
  rotation: number;
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={`relative rounded-full shadow-2xl flex items-center justify-center border-b-4 border-r-2 ${className}`}
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderColor: 'rgba(0,0,0,0.15)',
      transform: `rotate(${rotation}deg)`
    }}
  >
    <div
      className="absolute inset-1.5 rounded-full border-2 border-dashed opacity-40"
      style={{ borderColor: detailColor }}
    />
    <span className="font-serif font-bold relative z-10" style={{ color: detailColor, fontSize: `calc(${size} / 2.5)` }}>
      {children}
    </span>
  </div>
);

export default function LandingHero() {
  return (
    <section className="relative w-full pt-16 pb-48 px-6 overflow-hidden" style={{ backgroundColor: '#a2c7bf' }}>
      <Blob className="absolute top-0 left-0 w-96 h-96 opacity-40 z-0" />
      <Blob className="absolute bottom-0 right-0 w-[50rem] h-[50rem] opacity-30 z-0" />

      <div className="relative max-w-6xl mx-auto text-center z-10">

        <h1 className="font-serif text-6xl md:text-8xl font-bold mb-4 leading-tight text-[#012825]">
          Master your money. <br />
          <span className="italic text-[#928b5b]">Build your future.</span>
        </h1>

        {/* CTA Button */}
        <div className="mt-6">
          <Link
            href="/signup"
            className="inline-block bg-[#012825] hover:bg-[#023d38] text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          >
            Get Started
          </Link>
        </div>

        {/* Image + Coins */}
        <div className="relative mt-8 max-w-4xl mx-auto">

          {/* Coins */}
          <div className="absolute -left-16 md:-left-28 top-[-10%] w-40 md:w-64 z-30 pointer-events-none flex flex-col items-center gap-2">
            <Coin size="4rem" color="#e9d8a6" detailColor="#928b5b" rotation={-15} className="ml-20 translate-y-4">
              $
            </Coin>
            <Coin size="7rem" color="#ee9b00" detailColor="#928b5b" rotation={10} className="z-10 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
              $
            </Coin>
            <Coin size="5.5rem" color="#e9d8a6" detailColor="#928b5b" rotation={-25} className="-mt-6 -ml-12">
              $
            </Coin>
          </div>

          {/* Image frame */}
          <div className="relative z-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <Image
              src="/IMG_4705.jpg"
              alt="Dashboard preview"
              width={1200}
              height={700}
              className="w-full h-auto object-cover"
              priority
            />
          </div>

        </div>
      </div>

      <Wave className="absolute -bottom-1 left-0 w-full h-32 text-white z-40" />
    </section>
  );
}