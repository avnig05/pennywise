export default function LandingStats() {
  return (
    <section className="w-full py-16 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-5xl font-bold text-sage-500 mb-2">500+</div>
            <div className="text-gray-600 text-sm">Learning Articles</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-sage-500 mb-2">50K+</div>
            <div className="text-gray-600 text-sm">Students Learning</div>
          </div>
          <div>
            <div className="text-5xl font-bold text-sage-500 mb-2">100%</div>
            <div className="text-gray-600 text-sm">Free Forever</div>
          </div>
        </div>
      </div>
    </section>
  );
}
