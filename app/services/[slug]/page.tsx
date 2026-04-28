import { getServiceBySlug, getAllServiceSlugs } from '@/lib/services';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const slugs = getAllServiceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string | string[] }> }) {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const service = getServiceBySlug(slugValue);

  return {
    title: service ? `${service.title} | MLR Mainline Randy` : 'Website Services | MLR Mainline Randy',
    description: service
      ? service.description
      : 'Discover our comprehensive suite of website services designed to support modern businesses and reliable online presence.',
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug?: string | string[] }> }) {
  const { slug } = await params;
  const slugValue = Array.isArray(slug) ? slug[0] : slug;
  const service = getServiceBySlug(slugValue);

  const pageTitle = service ? service.title : 'Service Not Found';
  const serviceSubtitle = service?.subtitle ?? null;
  const pageDescription = service
    ? service.description
    : 'The requested service could not be found. Use the navigation or return to the services overview to continue.';
  const sections = service
    ? service.sections
    : [
        {
          heading: 'Service Not Found',
          description: 'We couldn’t find a matching service for this URL.',
          details: [
            'The requested service may have an invalid or outdated URL.',
            'If you arrived here from a navigation link, try refreshing the page.',
            'Return to the services overview to select an available service.',
          ],
        },
      ];
  const items = service?.items ?? [];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-neutral-950 text-white pt-28 pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center gap-4 text-sm uppercase tracking-[0.35em] text-neutral-400">
            <Link href="/" className="text-neutral-300 hover:text-white transition-colors duration-300">
              Home
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-200">Services</span>
            <span className="text-neutral-600">/</span>
            <span className="text-white">{pageTitle}</span>
          </div>

          <div className="max-w-4xl space-y-6">
            <p className="text-xs uppercase tracking-[0.45em] text-amber-500 font-light">
              {service ? 'Service Overview' : 'Service Details'}
            </p>
            <h1 className="text-5xl sm:text-6xl font-serif font-light leading-[1.05] tracking-tight">
              {pageTitle}
            </h1>
            {serviceSubtitle && (
              <p className="text-xl text-amber-400 font-light leading-relaxed">
                {serviceSubtitle}
              </p>
            )}
            <p className="text-xl text-neutral-300 font-light leading-relaxed">
              {pageDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-5">
                  {section.heading}
                </h2>
                <p className="text-lg text-neutral-600 font-light leading-relaxed max-w-3xl mb-6">
                  {section.description}
                </p>
                <ul className="list-disc list-inside space-y-3 max-w-3xl text-neutral-600 font-light leading-relaxed">
                  {section.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-950 leading-tight mb-8">
                Service Details
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8">
                    <h3 className="text-2xl font-serif font-light text-neutral-950 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-base text-neutral-600 font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="relative bg-neutral-950 text-white py-20 sm:py-28">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr] items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-serif font-light leading-tight mb-6">
                Ready to move forward with this service?
              </h2>
              <p className="text-lg text-neutral-300 font-light leading-relaxed max-w-2xl">
                If you are ready to launch a more effective website experience, we can turn this plan into a reliable, polished outcome for your business.
              </p>
            </div>

            <div className="space-y-4">
              <a
                href={`mailto:mainlinerandyptyltd@gmail.com?subject=Quote Request for ${service?.title || 'Website Service'}`}
                className="inline-flex items-center justify-center w-full rounded-full bg-amber-500 px-8 py-4 text-sm text-neutral-950 font-light uppercase tracking-[0.25em] transition-all duration-300 hover:bg-amber-400"
              >
                Get a Quote
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center w-full rounded-full border border-neutral-700 px-8 py-4 text-sm text-neutral-200 font-light uppercase tracking-[0.25em] transition-all duration-300 hover:border-amber-500 hover:text-amber-500"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
