export default function HeroImage() {
  return (
    <section className="w-full py-12 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-sm mb-2">Hero Image</p>
              <p className="text-xs">Student working at laptop</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
