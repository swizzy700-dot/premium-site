/**
 * Billing & Credits Service
 * Multi-tenant subscription management and usage tracking
 */

import { prisma } from './prisma';

// Type definitions until Prisma generates
type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'AGENCY' | 'ENTERPRISE';
type ResourceType = 'AUDIT_MOBILE' | 'AUDIT_DESKTOP' | 'AUDIT_COMBINED' | 'API_CALL' | 'REPORT_GENERATION' | 'EXPORT';
type Subscription = {
  id: string;
  workspaceId: string;
  plan: string;
  status: string;
  monthlyCredits: number;
  creditsUsed: number;
  creditsResetAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};
import { logger } from '@/utils/logger';

// Prisma client (singleton from lib/prisma)

// Credit allocation per plan
const PLAN_CREDITS: Record<PlanType, number> = {
  FREE: 50,
  STARTER: 200,
  PRO: 1000,
  AGENCY: 5000,
  ENTERPRISE: -1, // unlimited
};

interface CreditCheck {
  allowed: boolean;
  remaining: number;
  reason?: string;
}

interface UsageStats {
  totalUsed: number;
  monthlyLimit: number;
  remaining: number;
  resetDate: Date;
}

/**
 * Get or create subscription for workspace
 */
export async function getSubscription(workspaceId: string): Promise<Subscription> {
  let subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        workspaceId,
        plan: 'FREE',
        status: 'ACTIVE',
        monthlyCredits: PLAN_CREDITS.FREE,
        creditsUsed: 0,
      },
    });
  }

  // Check if credits need reset
  const now = new Date();
  if (subscription.creditsResetAt && subscription.creditsResetAt < now) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        creditsUsed: 0,
        creditsResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });
  }

  return subscription;
}

/**
 * Check if workspace has available credits
 */
export async function checkCredits(
  workspaceId: string,
  creditsNeeded: number = 1
): Promise<CreditCheck> {
  const subscription = await getSubscription(workspaceId);

  // Unlimited plans
  if (subscription.monthlyCredits === -1) {
    return { allowed: true, remaining: 999999 };
  }

  const remaining = subscription.monthlyCredits - subscription.creditsUsed;

  if (remaining < creditsNeeded) {
    return {
      allowed: false,
      remaining,
      reason: `Insufficient credits. Need ${creditsNeeded}, have ${remaining}. Upgrade your plan.`,
    };
  }

  return { allowed: true, remaining: remaining - creditsNeeded };
}

/**
 * Consume credits for a resource
 */
export async function consumeCredits(
  workspaceId: string,
  auditId: string | null,
  resource: ResourceType,
  credits: number,
  description?: string
): Promise<boolean> {
  try {
    const subscription = await getSubscription(workspaceId);

    // Unlimited plans don't consume
    if (subscription.monthlyCredits === -1) {
      await prisma.usageRecord.create({
        data: {
          workspaceId,
          auditId,
          resource,
          credits,
          description: description || `${resource} usage`,
          periodStart: subscription.currentPeriodStart || new Date(),
          periodEnd: subscription.currentPeriodEnd || new Date(),
        },
      });
      return true;
    }

    // Check sufficient credits
    const remaining = subscription.monthlyCredits - subscription.creditsUsed;
    if (remaining < credits) {
      logger.warn(`Credit consumption blocked for workspace ${workspaceId}`, {
        needed: credits,
        remaining,
      });
      return false;
    }

    // Update subscription and create usage record
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          creditsUsed: { increment: credits },
        },
      }),
      prisma.usageRecord.create({
        data: {
          workspaceId,
          auditId,
          resource,
          credits,
          description: description ?? `${resource} usage`,
          periodStart: subscription.currentPeriodStart ?? new Date(),
          periodEnd: subscription.currentPeriodEnd ?? new Date(),
        },
      }),
    ]);

    logger.info(`Credits consumed for workspace ${workspaceId}`, {
      resource,
      credits,
      auditId: auditId ?? undefined,
    });

    return true;
  } catch (error) {
    logger.error('Failed to consume credits', { error, workspaceId, auditId: auditId ?? undefined });
    return false;
  }
}

/**
 * Get usage statistics for workspace
 */
export async function getUsageStats(workspaceId: string): Promise<UsageStats> {
  const subscription = await getSubscription(workspaceId);

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    totalUsed: subscription.creditsUsed,
    monthlyLimit: subscription.monthlyCredits,
    remaining: subscription.monthlyCredits === -1 
      ? 999999 
      : subscription.monthlyCredits - subscription.creditsUsed,
    resetDate: subscription.creditsResetAt || nextMonth,
  };
}

/**
 * Upgrade workspace plan
 */
export async function upgradePlan(
  workspaceId: string,
  newPlan: string
): Promise<Subscription> {
  const subscription = await getSubscription(workspaceId);

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: newPlan,
      monthlyCredits: PLAN_CREDITS[newPlan as PlanType],
      creditsUsed: 0, // Reset on upgrade
      creditsResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    },
  });

  logger.info(`Workspace ${workspaceId} upgraded to ${newPlan}`);
  return updated;
}

/**
 * Get audit cost based on configuration
 */
export function getAuditCost(includeMobile: boolean, includeDesktop: boolean): number {
  if (includeMobile && includeDesktop) return 2; // Both devices
  return 1; // Single device
}

/**
 * Check if workspace can run audit
 */
export async function canRunAudit(
  workspaceId: string,
  includeMobile: boolean = true,
  includeDesktop: boolean = true
): Promise<{ allowed: boolean; reason?: string; cost: number }> {
  const cost = getAuditCost(includeMobile, includeDesktop);
  const creditCheck = await checkCredits(workspaceId, cost);

  return {
    allowed: creditCheck.allowed,
    reason: creditCheck.reason,
    cost,
  };
}
