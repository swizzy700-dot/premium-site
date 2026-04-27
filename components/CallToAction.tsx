import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="relative bg-neutral-950 text-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-serif font-light leading-tight">
              Start Your Project with Confidence
            </h2>
            <p className="text-lg text-neutral-300 font-light leading-relaxed max-w-2xl mx-auto">
              Ready to elevate your online presence? Let's collaborate to create a website that drives results and reflects your brand's excellence.
            </p>
          </div>
          <div className="pt-4">
            <Link
              href="/start-project"
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-8 py-4 text-sm text-neutral-950 font-light uppercase tracking-[0.25em] transition-all duration-300 hover:bg-amber-400 hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}