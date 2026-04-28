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
              Experience the difference in how Mainline Randy builds digital systems - designed with precision, driven by strategy, and refined for lasting impact.
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
                   Refined Design & Brand Presence
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  MLR creates visually striking digital experiences that communicate clarity, confidence, and professionalism at first glance. Every interface is carefully crafted to reflect a premium brand identity, ensuring your business is presented with authority and lasting visual impact.
                </p>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-6">
                  Strategic Business Approach
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  Every build is guided by intent, not decoration. We design with purpose - aligning structure, messaging, and user flow to attract the right audience, increase engagement, and support real business outcomes. Your website becomes a tool for positioning, not just presentation.
                </p>
              </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-6">
                  Performance & Technical Excellence
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  Beyond appearance, every system is engineered for speed, responsiveness, and reliability. We focus on smooth user experience, clean architecture, security standards, and full optimisation to ensure your platform performs consistently across all devices and conditions.
                </p>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-6">
                  Tailored Growth & End-to-End Execution
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed">
                  Each solution is custom-built around your brand goals, not a template or preset structure. From concept to launch and beyond, we deliver a complete, guided process designed to support scalability, long-term growth, and continuous improvement as your business evolves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
