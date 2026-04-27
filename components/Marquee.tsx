export default function Marquee() {
  const marks = Array.from({ length: 6 }, (_, index) => (
    <div key={index} className="flex items-center gap-5 whitespace-nowrap">
      <svg
        viewBox="0 0 122 42"
        className="h-14 w-auto text-amber-500 opacity-90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 24C18 6 31 4 39 16c5 8 15 12 22 9 8-3 14-20 24-18 8 2 6 18 4 26"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 28c8-4 14-18 24-18 8 0 12 16 20 18"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />
      </svg>
      <span className="text-[0.55rem] uppercase tracking-[0.55em] text-neutral-500 font-light opacity-80">
        Mainline Randy
      </span>
    </div>
  ));

  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/10 to-neutral-950 pointer-events-none" />
      <div className="relative">
        <div className="marquee flex gap-20">
          {marks}
          {marks}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .marquee {
          display: inline-flex;
          gap: 5rem;
          white-space: nowrap;
          animation: marquee 48s linear infinite;
          transform: translateZ(0);
        }
      `}</style>
    </div>
  );
}
