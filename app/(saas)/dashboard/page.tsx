/**
 * Main Dashboard
 * Overview of workspace activity and metrics
 */

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const prisma = new PrismaClient();

async function getDashboardData() {
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
                  _count: {
                    select: { projects: true, audits: true }
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

  // Get active workspace (first one for now)
  const activeMembership = session.user.memberships[0];
  if (!activeMembership) return null;

  const workspace = activeMembership.workspace;

  // Get recent audits
  const recentAudits = await prisma.audit.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { queuedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      url: true,
      status: true,
      overallScore: true,
      createdAt: true,
      project: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  // Get usage stats
  const subscription = workspace.subscriptions;
  const usagePercent = subscription 
    ? Math.round((subscription.creditsUsed / subscription.monthlyCredits) * 100)
    : 0;

  return {
    user: session.user,
    workspace,
    recentAudits,
    stats: {
      totalProjects: workspace._count.projects,
      totalAudits: workspace._count.audits,
      usagePercent,
      creditsRemaining: subscription ? subscription.monthlyCredits - subscription.creditsUsed : 0,
      plan: subscription?.plan || 'FREE'
    }
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect('/auth/login');
  }

  const { workspace, recentAudits, stats } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
          <p className="text-slate-500 mt-1">Overview of your website intelligence</p>
        </div>
        <Link
          href="/audits/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Run New Audit
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={Activity}
          trend="+2 this month"
        />
        <StatCard
          title="Total Audits"
          value={stats.totalAudits}
          icon={Clock}
          trend="+12 this month"
        />
        <StatCard
          title="Avg. Score"
          value="78"
          icon={TrendingUp}
          trend="+5% improvement"
        />
        <StatCard
          title="Credits Left"
          value={stats.creditsRemaining}
          icon={AlertCircle}
          trend={`${stats.usagePercent}% used`}
          alert={stats.usagePercent > 80}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audits */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Audits</h2>
            <Link href="/audits" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          
          <div className="divide-y divide-slate-200">
            {recentAudits.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500">No audits yet. Run your first audit to get started.</p>
                <Link
                  href="/audits/new"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start Audit →
                </Link>
              </div>
            ) : (
              recentAudits.map((audit) => (
                <div key={audit.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <ScoreBadge score={audit.overallScore || 0} />
                      <div>
                        <Link 
                          href={`/audits/${audit.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {audit.url}
                        </Link>
                        <p className="text-sm text-slate-500">
                          {audit.project?.name || 'Direct Audit'} • {formatDate(audit.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={audit.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Plan */}
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Current Plan</p>
            <p className="text-2xl font-bold mt-1">{stats.plan}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-blue-100">Credits used</span>
                <span className="font-medium">{stats.usagePercent}%</span>
              </div>
              <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${stats.usagePercent}%` }}
                />
              </div>
            </div>
            <Link
              href="/billing"
              className="mt-4 block text-center bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Upgrade Plan
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              <QuickAction href="/projects/new" label="Create New Project" />
              <QuickAction href="/audits/new" label="Run Single Audit" />
              <QuickAction href="/settings" label="Manage Workspace" />
              <QuickAction href="/billing" label="View Usage History" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  alert 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${alert ? 'bg-red-100' : 'bg-slate-100'}`}>
          <Icon className={`w-5 h-5 ${alert ? 'text-red-600' : 'text-slate-600'}`} />
        </div>
      </div>
      <p className={`text-sm mt-4 ${alert ? 'text-red-600' : 'text-green-600'}`}>
        {trend}
      </p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-100 text-green-700' : 
                score >= 70 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700';
  
  return (
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center font-bold`}>
      {score || '-'}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    QUEUED: 'bg-slate-100 text-slate-700',
    FAILED: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.QUEUED}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-700"
    >
      {label}
      <span className="text-slate-400">→</span>
    </Link>
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
