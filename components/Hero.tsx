import Marquee from './Marquee';

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.14),transparent_32%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/95 pointer-events-none" />

      <div className="relative min-h-screen pt-24 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-[1.35fr_1fr] items-center">
            <div className="max-w-3xl space-y-12">
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.45em] text-neutral-500 font-light">
                  Engineered for Presence. Designed for Growth.
                </p>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-light leading-[0.95] tracking-tight text-white">
                  Your Website Looks Good. But It’s Slow.
                </h1>
                <p className="max-w-2xl text-xl sm:text-2xl text-neutral-300 leading-relaxed font-light">
                  We optimize performance, speed, user experience, and dynamic data visualization systems to ensure a seamless, data-driven experience all while preserving your original design integrity and brand identity without compromise.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#check"
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-8 py-4 text-sm text-neutral-950 font-light tracking-[0.25em] uppercase transition-all duration-300 hover:bg-amber-400"
                >
                  Check My Website
                </a>
                <a
                  href="#results"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-8 py-4 text-sm text-neutral-200 font-light tracking-[0.25em] uppercase transition-all duration-300 hover:border-amber-500 hover:text-amber-500"
                >
                  See Results
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute inset-0 rounded-[2.5rem] bg-white/5 blur-3xl opacity-40" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-neutral-950/85 shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/hero-poster.jpg"
                  className="h-full w-full min-h-[420px] object-cover"
                >
                  <source src="/hero-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/10 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.35em] text-neutral-200 font-light">
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Marquee />
      </div>
    </section>
  );
}
