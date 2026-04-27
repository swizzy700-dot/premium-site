import Link from 'next/link';

export default function WhyChooseMLR() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-neutral-950 text-white pt-32 pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center gap-4 text-sm uppercase tracking-[0.35em] text-neutral-400">
            <Link href="/" className="text-neutral-300 hover:text-white transition-colors duration-300">
              Home
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-white">Why Choose MLR</span>
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl sm:text-6xl font-serif font-light leading-[1.05] tracking-tight">
              Why Choose MLR
            </h1>
            <p className="text-xl text-neutral-300 font-light leading-relaxed">
              Discover what sets Mainline Randy apart in delivering premium digital solutions.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-6">
                  Performance-Driven Excellence
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  We don't just build websites—we engineer high-performance digital experiences that drive results. Every project is optimized for speed, scalability, and conversion.
                </p>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-6">
                  Premium Design Philosophy
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  Our design approach combines luxury aesthetics with functional excellence. We create digital experiences that reflect your brand's premium positioning and values.
                </p>
              </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-6">
                  Strategic Partnership
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  We become your digital strategy partner, not just a service provider. Our team works closely with you to understand your goals and deliver solutions that drive measurable impact.
                </p>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-6">
                  Technical Mastery
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  Leveraging cutting-edge technologies and best practices, we build robust, secure, and future-proof digital platforms that grow with your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
