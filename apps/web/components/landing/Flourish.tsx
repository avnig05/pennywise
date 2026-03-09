
interface FlourishProps {
  className?: string;
}

export default function Flourish({ className }: FlourishProps) {
  return (
    <svg className={`absolute ${className} w-16 h-16 text-gold/50`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 80 C40 20, 60 20, 80 80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 80 C 40 50, 60 50, 50 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
