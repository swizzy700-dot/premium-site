import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Testimonials from '@/components/Testimonials';
import AuthorityHub from '@/components/AuthorityHub';
import CallToAction from '@/components/CallToAction';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="bg-neutral-950">
        <Hero />
        <Services />
        <Testimonials />
        <AuthorityHub />
        <CallToAction />
        <Contact />
      </main>
    </>
  );
}
