export default function CutePlant() {
  return (
    <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hand-Drawn Pot */}
      <path 
        d="M25,65 Q22,65 22,68 V72 Q22,75 25,75 H75 Q78,75 78,72 V68 Q78,65 75,65 Z" 
        fill="#b38b6d" 
        stroke="#5C4033" 
        strokeWidth="1.5"
      />
      <path 
        d="M28,75 Q25,75 25,78 V95 Q25,108 50,108 Q75,108 75,95 V78 Q75,75 72,75 Z" 
        fill="#e1c6ac" 
        stroke="#5C4033" 
        strokeWidth="1.5"
      />

      {/* Cute Face */}
      <circle cx="42" cy="90" r="2.5" fill="#5C4033" />
      <circle cx="58" cy="90" r="2.5" fill="#5C4033" />
      <path 
        d="M49,94 Q50,96 51,94" 
        stroke="#5C4033" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
      />

      {/* Rounder Leaves with Outlines */}
      <path 
        d="M50,65 Q50,25 35,25 Q20,25 20,45 Q20,65 50,65 Z" 
        fill="#a3cec3" 
        stroke="#5C4033" 
        strokeWidth="1.5"
      />
      <path 
        d="M50,65 Q50,15 65,15 Q80,15 80,35 Q80,55 50,65 Z" 
        fill="#6e998f" 
        stroke="#5C4033" 
        strokeWidth="1.5"
      />
      <path 
        d="M50,65 C35,65 35,30 50,30 C65,30 65,65 50,65 Z" 
        fill="#8ebaaf" 
        stroke="#5C4033" 
        strokeWidth="1.5"
      />
    </svg>
  );
}