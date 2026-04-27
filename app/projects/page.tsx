import Link from 'next/link';

export default function Projects() {
  const projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      category: 'Web Development',
      description: 'High-performance e-commerce solution with custom CMS integration.',
      image: '/api/placeholder/600/400',
    },
    {
      id: 2,
      title: 'Brand Identity System',
      category: 'Design',
      description: 'Complete brand identity including logo, typography, and guidelines.',
      image: '/api/placeholder/600/400',
    },
    {
      id: 3,
      title: 'Mobile App Development',
      category: 'App Development',
      description: 'Cross-platform mobile application with native performance.',
      image: '/api/placeholder/600/400',
    },
    {
      id: 4,
      title: 'Marketing Campaign',
      category: 'Digital Marketing',
      description: 'Comprehensive digital marketing strategy and execution.',
      image: '/api/placeholder/600/400',
    },
    {
      id: 5,
      title: 'Corporate Website',
      category: 'Web Development',
      description: 'Premium corporate website with advanced CMS capabilities.',
      image: '/api/placeholder/600/400',
    },
    {
      id: 6,
      title: 'Product Launch',
      category: 'Strategy',
      description: 'End-to-end product launch strategy and digital presence.',
      image: '/api/placeholder/600/400',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-neutral-950 text-white pt-32 pb-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center gap-4 text-sm uppercase tracking-[0.35em] text-neutral-400">
            <Link href="/" className="text-neutral-300 hover:text-white transition-colors duration-300">
              Home
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-white">Projects</span>
          </div>

          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl sm:text-6xl font-serif font-light leading-[1.05] tracking-tight">
              Our Projects
            </h1>
            <p className="text-xl text-neutral-300 font-light leading-relaxed">
              Explore our portfolio of premium digital solutions and successful client partnerships.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="group cursor-pointer">
                <div className="aspect-[4/3] bg-neutral-200 rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-400 flex items-center justify-center">
                    <span className="text-neutral-600 text-sm">Project Image</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 font-light">
                    {project.category}
                  </div>
                  <h3 className="text-xl font-serif font-light text-neutral-950 group-hover:text-amber-600 transition-colors duration-300">
                    {project.title}
                  </h3>
                  <p className="text-sm text-neutral-600 font-light leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
