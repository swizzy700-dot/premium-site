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
                <h1 className="text-5xl sm:text-6xl lg:text-6xl font-serif font-light leading-[0.95] tracking-tight text-white">
                  Take a closer look at what your digital presence could become.
                </h1>
                <p className="max-w-2xl text-xl sm:text-2xl text-amber-200 leading-relaxed font-light tracking-wide">
                  Not every issue is visible at first glance.  
                  Beneath the surface, performance, structure, and user flow tell a very different story.  
                  Take a moment to evaluate your website - and see what&apos;s really happening.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <a
                  href="#check"
                  className="inline-flex items-center justify-center rounded-full bg-amber-500 px-10 py-5 text-base text-neutral-950 font-light tracking-[0.25em] uppercase transition-all duration-300 hover:bg-amber-400 hover:scale-105"
                >
                  Check Your Website Performance
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="relative overflow-hidden">
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
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/40 via-transparent to-transparent pointer-events-none" />
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
