'use client';

import { useState } from 'react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = 'Contact Form Submission';
    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const mailtoLink = `mailto:mainlinerandyptyltd@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-serif font-light text-neutral-950 leading-tight mb-6">
            Get In Touch
          </h2>
          <p className="text-lg text-neutral-600 font-light leading-relaxed">
            Ready to discuss your project? Send us a message and let&apos;s create something exceptional together.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-light text-neutral-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-light text-neutral-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-light text-neutral-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
                placeholder="Tell us about your project..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-amber-500 px-8 py-4 text-sm text-neutral-950 font-light uppercase tracking-[0.25em] transition-all duration-300 hover:bg-amber-400 hover:scale-105"
            >
              Send Message
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-500 font-light">
              Or email us directly at{' '}
              <a
                href="mailto:mainlinerandyptyltd@gmail.com"
                className="text-amber-600 hover:text-amber-700 transition-colors"
              >
                mainlinerandyptyltd@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}