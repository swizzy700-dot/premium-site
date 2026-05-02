/**
 * SaaS Dashboard Layout
 * Protected layout for authenticated users
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/Header';

const prisma = new PrismaClient();

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}

export default async function SaaSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
