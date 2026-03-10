"use client";
import { type ReactNode } from "react";
import { motion } from "framer-motion";

const Coin = ({
  size,
  color,
  detailColor,
  rotation,
  className,
  children,
  animationDelay,
}: {
  size: string;
  color: string;
  detailColor: string;
  rotation: number;
  className?: string;
  children: ReactNode;
  animationDelay: number;
}) => (
  <motion.div
    className={`absolute rounded-full shadow-2xl flex items-center justify-center border-b-4 border-r-2 ${className}`}
    style={{
      width: size,
      height: size,
      backgroundColor: color,
      borderColor: 'rgba(0,0,0,0.15)',
    }}
    initial={{ y: -5, rotate: rotation - 5 }}
    animate={{ y: 5, rotate: rotation + 5 }}
    transition={{
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "mirror",
      delay: animationDelay,
    }}
  >
    <div
      className="absolute inset-1.5 rounded-full border-2 border-dashed opacity-40"
      style={{ borderColor: detailColor }}
    />
    <span
      className="font-serif font-bold relative z-10"
      style={{ color: detailColor, fontSize: `calc(${size} / 2.5)` }}
    >
      {children}
    </span>
  </motion.div>
);

export default function CoinIllustration({ className }: { className?: string }) {
  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      {/* Top Coin - Smallest */}
      <Coin
        size="4rem"
        color="#e9d8a6"
        detailColor="#928b5b"
        rotation={-15}
        animationDelay={0.2}
        className="ml-20 translate-y-4"
      >
        $
      </Coin>

      {/* Middle Coin - Main Gold Coin */}
      <Coin
        size="7rem"
        color="#ee9b00"
        detailColor="#928b5b"
        rotation={10}
        animationDelay={0}
        className="z-10 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
      >
        $
      </Coin>

      {/* Bottom Coin - Slightly offset */}
      <Coin
        size="5.5rem"
        color="#e9d8a6"
        detailColor="#928b5b"
        rotation={-25}
        animationDelay={0.5}
        className="-mt-6 -ml-12"
      >
        $
      </Coin>
    </div>
  );
}
