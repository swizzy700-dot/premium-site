import Link from 'next/link';

export default function StartProject() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-neutral-950 text-white pt-32 pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center gap-4 text-sm uppercase tracking-[0.35em] text-neutral-400">
            <Link href="/" className="text-neutral-300 hover:text-white transition-colors duration-300">
              Home
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-white">Start Your Project</span>
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl sm:text-6xl font-serif font-light leading-[1.05] tracking-tight">
              Start Your Project
            </h1>
            <p className="text-xl text-neutral-300 font-light leading-relaxed">
              Ready to elevate your digital presence? Let's discuss your vision and create something extraordinary together.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <form className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-light text-neutral-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-light text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-light text-neutral-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="project" className="block text-sm font-light text-neutral-700 mb-2">
                  Project Details
                </label>
                <textarea
                  id="project"
                  name="project"
                  rows={6}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Tell us about your project, goals, and timeline..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 text-neutral-950 px-8 py-4 rounded-full font-light tracking-[0.25em] uppercase transition-all duration-300 hover:bg-amber-400"
              >
                Submit Project Request
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
