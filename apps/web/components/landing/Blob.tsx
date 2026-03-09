
interface BlobProps {
  className?: string;
}

export default function Blob({ className }: BlobProps) {
  return (
    <div className={`absolute ${className} opacity-60`}>
      <svg viewBox="0 0 500 500" fill="#6f998f" xmlns="http://www.w3.org/2000/svg">
        <path d="M422.5 314.5Q389 379 314.5 422Q240 465 169.5 422.5Q99 380 73 305.5Q47 231 92.5 166Q138 101 209.5 67Q281 33 346.5 83.5Q412 134 422.5 224.5Q433 315 422.5 314.5Z" />
      </svg>
    </div>
  );
}
