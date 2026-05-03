import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | WebIntel",
  description: "Professional website analysis and optimization services",
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Our Services</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-50 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">Website Analysis</h3>
            <p className="text-slate-600">Comprehensive performance audits with actionable insights.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">SEO Optimization</h3>
            <p className="text-slate-600">Improve search rankings and organic traffic.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-xl">
            <h3 className="text-xl font-semibold mb-3">Performance Tuning</h3>
            <p className="text-slate-600">Speed optimization for better user experience.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
