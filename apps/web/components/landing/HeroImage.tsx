import Image from "next/image";

export default function HeroImage() {
  return (
    <section className="w-full py-12 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
          <Image src="/officelady.webp" alt="Lady working at a desk" layout="fill" objectFit="cover" />
        </div>
      </div>
    </section>
  );
}
