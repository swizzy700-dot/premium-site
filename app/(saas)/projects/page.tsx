/**
 * Projects Page
 * Manage workspace projects
 */

import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Plus, Globe, Clock, TrendingUp } from 'lucide-react';

const prisma = new PrismaClient();

async function getProjects() {
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
                  projects: {
                    include: {
                      _count: { select: { audits: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!session || !session.user.memberships[0]) return null;

  return {
    workspace: session.user.memberships[0].workspace,
    projects: session.user.memberships[0].workspace.projects
  };
}

export default async function ProjectsPage() {
  const data = await getProjects();

  if (!data) {
    redirect('/auth/login');
  }

  const { workspace, projects } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Manage your website projects</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
          <p className="text-slate-500 mb-6">Create your first project to start monitoring websites</p>
          <Link
            href="/projects/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: { id: string; name: string; slug: string; baseUrl: string; createdAt: Date; lastAuditAt: Date | null; _count: { audits: number } }) => (
            <ProjectCard key={project.id} project={project} workspaceSlug={workspace.slug} />
          ))}
        </div>
      )}
    </div>
  );
}

interface Project {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  createdAt: Date;
  lastAuditAt: Date | null;
  _count: { audits: number };
}

function ProjectCard({ project, workspaceSlug }: { project: Project; workspaceSlug: string }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group">
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {project.lastAuditAt ? formatDate(project.lastAuditAt) : 'Never audited'}
          </span>
        </div>

        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-slate-500 mt-1 truncate">{project.baseUrl}</p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {project._count.audits} audits
          </span>
          <span className="text-sm text-blue-600 font-medium">View →</span>
        </div>
      </div>
    </Link>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
