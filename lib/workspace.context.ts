/**
 * Workspace Context
 * Multi-tenant isolation layer for all SaaS operations
 */

import { prisma } from './prisma';

// Prisma client (singleton from lib/prisma)

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: string;
  plan: string;
  permissions: string[];
}

/**
 * Verify workspace access for user
 */
export async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<{ allowed: boolean; context?: WorkspaceContext; error?: string }> {
  // Check if user is member of workspace
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: {
        include: {
          subscriptions: true,
        },
      },
    },
  });

  if (!membership) {
    return { allowed: false, error: 'Access denied - not a workspace member' };
  }

  // Check workspace is active
  if (!membership.workspace) {
    return { allowed: false, error: 'Workspace not found' };
  }

  const permissions = getRolePermissions(membership.role);

  return {
    allowed: true,
    context: {
      workspaceId,
      userId,
      role: membership.role,
      plan: membership.workspace.subscriptions?.plan || 'FREE',
      permissions,
    },
  };
}

/**
 * Get permissions for role
 */
function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    OWNER: ['read', 'write', 'delete', 'billing', 'settings', 'invite', 'audit'],
    ADMIN: ['read', 'write', 'delete', 'settings', 'invite', 'audit'],
    MEMBER: ['read', 'write', 'audit'],
    VIEWER: ['read'],
  };

  return permissions[role] || ['read'];
}

/**
 * Check if user can perform action
 */
export function canPerform(
  context: WorkspaceContext,
  action: string
): boolean {
  return context.permissions.includes(action);
}

/**
 * Require permission or throw
 */
export function requirePermission(
  context: WorkspaceContext,
  action: string
): void {
  if (!canPerform(context, action)) {
    throw new Error(`Permission denied: ${action} not allowed for role ${context.role}`);
  }
}

/**
 * Create workspace with owner
 */
export async function createWorkspace(
  name: string,
  ownerId: string,
  slug?: string
) {
  const workspaceSlug = slug || generateSlug(name);

  return await prisma.$transaction(async (tx) => {
    // Create workspace
    const workspace = await tx.workspace.create({
      data: {
        name,
        slug: workspaceSlug,
        ownerId,
      },
    });

    // Add owner as member
    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: ownerId,
        role: 'OWNER',
        joinedAt: new Date(),
      },
    });

    // Create free subscription
    await tx.subscription.create({
      data: {
        workspaceId: workspace.id,
        plan: 'FREE',
        status: 'ACTIVE',
        monthlyCredits: 50,
        creditsUsed: 0,
      },
    });

    return workspace;
  });
}

/**
 * Invite member to workspace
 */
export async function inviteMember(
  workspaceId: string,
  email: string,
  role: string,
  invitedBy: string
) {
  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Create placeholder user (they'll need to complete registration)
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: '', // placeholder
        isActive: false,
      },
    });
  }

  // Create membership
  return await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: user.id,
      role,
    },
  });
}

/**
 * Generate URL-friendly slug
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Get all workspaces for user
 */
export async function getUserWorkspaces(userId: string) {
  return await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          subscriptions: true,
          _count: {
            select: { members: true, projects: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}
