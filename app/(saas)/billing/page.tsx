/**
 * Billing & Usage Page
 * Credit tracking and plan management
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CreditCard, Zap, Check } from 'lucide-react';

// Prisma client (singleton from lib/prisma)

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    credits: 50,
    features: ['50 audits/month', 'Mobile + Desktop audits', 'Basic reports', '7-day audit history'],
    cta: 'Current Plan',
    current: true,
  },
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    credits: 200,
    features: ['200 audits/month', 'Priority processing', 'Advanced reports', '30-day history', 'PDF exports'],
    cta: 'Upgrade',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    credits: 1000,
    features: ['1000 audits/month', 'Fastest processing', 'Full API access', 'Unlimited history', 'Custom branding', 'Priority support'],
    cta: 'Upgrade',
  },
  {
    name: 'Agency',
    price: '$299',
    period: '/month',
    credits: 5000,
    features: ['5000 audits/month', 'White-label reports', 'Team collaboration', 'Advanced API', 'Dedicated support', 'SLA guarantee'],
    cta: 'Contact Sales',
  },
];

async function getBillingData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              workspace: {
                include: {
                  subscriptions: true,
                  usageRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!session) return null;

  const workspace = session.user.memberships[0]?.workspace;
  if (!workspace) return null;

  const subscription = workspace.subscriptions;

  // Calculate usage by resource type
  const usageByResource = workspace.usageRecords.reduce((acc: Record<string, number>, record: { resource: string; credits: number }) => {
    acc[record.resource] = (acc[record.resource] || 0) + record.credits;
    return acc;
  }, {} as Record<string, number>);

  return {
    workspace,
    subscription,
    usage: {
      total: subscription?.creditsUsed || 0,
      limit: subscription?.monthlyCredits || 50,
      remaining: (subscription?.monthlyCredits || 50) - (subscription?.creditsUsed || 0),
      byResource: usageByResource,
      percent: subscription?.monthlyCredits 
        ? Math.round((subscription.creditsUsed / subscription.monthlyCredits) * 100)
        : 0,
    },
    recentUsage: workspace.usageRecords,
  };
}

export default async function BillingPage() {
  const data = await getBillingData();

  if (!data) {
    redirect('/auth/login');
  }

  const { workspace, subscription, usage, recentUsage } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Beta Access Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-blue-900">Beta Access</h3>
            <p className="text-sm text-blue-700 mt-1">
              Beta access is currently free. All features are temporarily unlocked for exploration. 
              Paid plans will launch soon.
            </p>
          </div>
        </div>
      </div>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Usage</h1>
        <p className="text-slate-500 mt-1">Manage your plan and track usage</p>
      </div>

      {/* Current Usage */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Current Usage</h2>
          <span className="text-sm text-slate-500">
            Resets on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}
          </span>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 relative">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={usage.percent > 80 ? '#ef4444' : '#3b82f6'}
                  strokeWidth="3"
                  strokeDasharray={`${usage.percent}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-900">{usage.percent}%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{usage.total} / {usage.limit}</p>
              <p className="text-slate-500">credits used this month</p>
              <p className="text-sm text-green-600 mt-1">{usage.remaining} remaining</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <UsageCard 
              label="Audit Credits"
              value={(usage.byResource['AUDIT_MOBILE'] || 0) + (usage.byResource['AUDIT_DESKTOP'] || 0)}
              icon={Zap}
            />
            <UsageCard 
              label="API Calls"
              value={usage.byResource['API_CALL'] || 0}
              icon={CreditCard}
            />
            <UsageCard 
              label="Reports"
              value={usage.byResource['REPORT_GENERATION'] || 0}
              icon={Check}
            />
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>

      {/* Recent Usage */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Recent Usage</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {recentUsage.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No usage recorded yet
            </div>
          ) : (
            recentUsage.map((record: { id: string; resource: string; credits: number; createdAt: Date }) => (
              <div key={record.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{record.resource}</p>
                  <p className="text-sm text-slate-500">{formatDate(record.createdAt)}</p>
                </div>
                <span className="text-slate-900 font-medium">-{record.credits} credits</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function UsageCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function PlanCard({ plan }: { plan: typeof PLANS[0] }) {
  return (
    <div className={`rounded-xl border ${plan.popular ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} overflow-hidden bg-white`}>
      {plan.popular && (
        <div className="bg-blue-500 text-white text-xs font-medium py-1 text-center">
          Most Popular
        </div>
      )}
      <div className="p-6">
        <h3 className="font-semibold text-slate-900">{plan.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
          {plan.period && <span className="text-slate-500">{plan.period}</span>}
        </div>
        <p className="text-sm text-slate-500 mt-1">{plan.credits} credits/month</p>

        <ul className="mt-6 space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        {/* Beta: All upgrade buttons disabled */}
        <button
          className={`w-full mt-6 py-2 px-4 rounded-lg font-medium transition-colors ${
            plan.current
              ? 'bg-slate-100 text-slate-600 cursor-default'
              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
          }`}
          disabled={true}
          title="Payments launching soon"
        >
          {plan.current ? plan.cta : 'Coming Soon'}
        </button>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
