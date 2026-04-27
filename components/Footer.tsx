export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white py-12 sm:py-16 mt-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-serif font-light">
              Mainline Randy (MLR)
            </h3>
            <p className="text-sm text-neutral-400 font-light uppercase tracking-[0.15em]">
              Premium Digital Solutions • Websites that build credibility & growth
            </p>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent"></div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              All content, designs, text, graphics, and intellectual property on this website are the exclusive property of Mainline Randy (MLR) and may not be reproduced, distributed, or used without prior written consent.
            </p>
            <p className="text-xs text-neutral-400 font-light">
              © 2026 MLR. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}