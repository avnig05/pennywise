import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer className="w-full py-8 px-6 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/pennywise-logo.png"
              alt="Pennywise"
              width={20}
              height={20}
              className="h-5 w-auto brightness-0"
            />
            <span className="text-sm text-gray-600">© 2026 Pennywise</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-sage-500">About</a>
            <a href="#" className="hover:text-sage-500">Privacy</a>
            <a href="#" className="hover:text-sage-500">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
