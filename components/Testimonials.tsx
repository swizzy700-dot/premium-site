'use client';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  image?: string;
  rating: number;
  review: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'Creative Director',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    rating: 5,
    review: 'The transformation was extraordinary. They didn\'t just build a website—they crafted a digital experience that elevated our brand and attracted high-value clients. Exceptional attention to detail.',
  },
  {
    id: '2',
    name: 'Marcus Thompson',
    role: 'Business Owner',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    rating: 4,
    review: 'Fast, professional, and genuinely invested in our success. The site performs beautifully and reflects our brand perfectly.',
  },
  {
    id: '3',
    name: 'Elena Voss',
    role: 'Entrepreneur',
    rating: 5,
    review: 'Responsive team, polished design, seamless execution. They managed the entire process impeccably and kept us informed at every step. Highly recommend.',
  },
  {
    id: '4',
    name: 'James Chen',
    role: 'Marketing Executive',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    rating: 5,
    review: 'Outstanding strategic approach. Our conversion rate improved significantly within weeks. The website truly stands out in our competitive market.',
  },
  
    
  
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-amber-500 text-amber-500'
              : 'fill-neutral-300 text-neutral-300'
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function VerificationBadge() {
  return (
    <div className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500 text-white">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="relative bg-neutral-50 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.45em] text-neutral-600 font-light mb-4">
            Client Trust & Results
          </p>
          <h2 className="text-5xl sm:text-6xl font-serif font-light leading-[1.1] tracking-tight text-neutral-950 max-w-3xl mb-6">
            Proven Excellence
          </h2>
          <p className="max-w-2xl text-lg text-neutral-600 font-light leading-relaxed">
            Trusted by premium brands and ambitious entrepreneurs. Our clients consistently report elevated digital presence and measurable business impact.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_20px_60px_rgba(212,175,55,0.12)] hover:scale-105 ${
                index === 3 ? 'md:col-span-1 lg:col-span-1' : ''
              } ${index === 4 ? 'md:col-span-1 md:col-start-2 lg:col-span-1 lg:col-start-auto' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/5 transition-all duration-500 pointer-events-none" />

              <div className="relative space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {testimonial.image && (
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="h-14 w-14 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-light text-neutral-950">{testimonial.name}</p>
                        <VerificationBadge />
                      </div>
                      <p className="text-sm text-neutral-600 font-light">{testimonial.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={testimonial.rating} />
                  <span className="text-xs text-neutral-500 font-light">{testimonial.rating}.0</span>
                </div>

                <p className="text-base text-neutral-700 font-light leading-relaxed">
                  {testimonial.review}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

