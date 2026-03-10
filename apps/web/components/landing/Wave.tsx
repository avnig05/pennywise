
interface WaveProps {
  className?: string;
}

export default function Wave({ className }: WaveProps) {
  return (
    <div className={`absolute w-full ${className}`}>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
        <path d="M0,50 C250,90 350,90 600,50 C850,10 950,10 1200,50 L1200,120 L0,120 Z" fill="white"/>
      </svg>
    </div>
  );
}
