'use client';

import { useState } from 'react';
import { Download, Mail, Smartphone, Monitor, AlertTriangle, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';

interface AuditData {
  url: string;
  title?: string;
  domain?: string;
  screenshot?: string;
  mobileScore: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    overall: number;
  };
  desktopScore: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    overall: number;
  };
  mobileInsights: IntelligenceInsight[];
  desktopInsights: IntelligenceInsight[];
  recommendations: Recommendation[];
  executiveSummary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface IntelligenceInsight {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  finding: string;
  impact: string;
  opportunity: string;
}

interface Recommendation {
  priority: number;
  title: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  impact: string;
  action: string;
}

interface PremiumReportProps {
  data: AuditData;
  onDownloadPDF?: () => void;
  onEmailReport?: (email: string) => void;
}

export function PremiumReport({ data, onDownloadPDF, onEmailReport }: PremiumReportProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [activeDevice, setActiveDevice] = useState<'mobile' | 'desktop'>('mobile');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onEmailReport) {
      onEmailReport(email);
      setEmailSent(true);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const activeScore = activeDevice === 'mobile' ? data.mobileScore : data.desktopScore;
  const activeInsights = activeDevice === 'mobile' ? data.mobileInsights : data.desktopInsights;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Website Preview Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start gap-4">
            {data.screenshot ? (
              <div className="w-48 h-32 rounded-lg overflow-hidden shadow-md border border-slate-200 flex-shrink-0">
                <img 
                  src={`data:image/jpeg;base64,${data.screenshot}`} 
                  alt={data.title || 'Website preview'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-48 h-32 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-8 h-8 text-slate-400" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 truncate">
                {data.title || data.domain || 'Website Analysis'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">{data.domain}</p>
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700 mt-2"
              >
                Visit Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            {/* Overall Grade */}
            <div className={`px-6 py-4 rounded-xl border-2 ${getScoreColor(data.mobileScore.overall)}`}>
              <div className="text-3xl font-bold text-center">{getGrade(data.mobileScore.overall)}</div>
              <div className="text-xs font-medium uppercase tracking-wide mt-1">Overall Grade</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {data.riskLevel === 'CRITICAL' ? (
              <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
            ) : data.riskLevel === 'HIGH' ? (
              <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Executive Summary</h2>
              <p className="text-slate-600 mt-2 leading-relaxed">{data.executiveSummary}</p>
            </div>
          </div>
        </div>

        {/* Mobile-First Notice */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-sm p-4 mb-6 text-white">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5" />
            <div>
              <p className="font-medium">Mobile-First Analysis</p>
              <p className="text-blue-100 text-sm">Mobile performance is the primary user experience driver. Over 60% of web traffic is mobile.</p>
            </div>
          </div>
        </div>

        {/* Device Toggle & Scores */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Performance Scores</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveDevice('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeDevice === 'mobile' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile (Primary)
              </button>
              <button
                onClick={() => setActiveDevice('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeDevice === 'desktop' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Performance', score: activeScore.performance },
              { label: 'Accessibility', score: activeScore.accessibility },
              { label: 'Best Practices', score: activeScore.bestPractices },
              { label: 'SEO', score: activeScore.seo },
            ].map((item) => (
              <div key={item.label} className={`p-4 rounded-lg border ${getScoreColor(item.score)}`}>
                <div className="text-2xl font-bold">{item.score}</div>
                <div className="text-xs font-medium uppercase tracking-wide mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Intelligent Analysis</h3>
          <div className="space-y-4">
            {activeInsights.map((insight, index) => (
              <div key={index} className="border-l-4 border-slate-200 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium uppercase tracking-wide px-2 py-1 rounded ${
                    insight.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    insight.severity === 'high' ? 'bg-amber-100 text-amber-700' :
                    insight.severity === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.category}
                  </span>
                  <span className={`text-xs font-medium uppercase ${
                    insight.severity === 'critical' ? 'text-red-600' :
                    insight.severity === 'high' ? 'text-amber-600' :
                    insight.severity === 'medium' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {insight.severity}
                  </span>
                </div>
                <h4 className="font-medium text-slate-900">{insight.finding}</h4>
                <p className="text-sm text-slate-600 mt-1">{insight.impact}</p>
                <p className="text-sm text-blue-600 mt-2 font-medium">{insight.opportunity}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Strategic Recommendations</h3>
          <div className="space-y-4">
            {data.recommendations.slice(0, 5).map((rec) => (
              <div key={rec.priority} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {rec.priority}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{rec.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{rec.rationale}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-slate-500">Effort: <span className="font-medium text-slate-700 capitalize">{rec.effort}</span></span>
                    <span className="text-slate-500">Impact: <span className="font-medium text-slate-700 capitalize">{rec.impact}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download & Email Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Download PDF */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Download className="w-6 h-6" />
              <h3 className="font-semibold">Download PDF Report</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Get a professional PDF report perfect for sharing with clients or stakeholders.
            </p>
            <button 
              onClick={onDownloadPDF}
              className="w-full px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
          </div>

          {/* Email Report */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Email This Report</h3>
            </div>
            
            {emailSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">Report sent!</p>
                </div>
                <p className="text-green-600 text-sm mt-1">Check your inbox for the full analysis.</p>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit}>
                <p className="text-slate-600 text-sm mb-4">
                  Get your report delivered to your inbox for easy reference and sharing.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
