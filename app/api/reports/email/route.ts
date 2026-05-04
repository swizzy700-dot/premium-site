import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAuditReportEmail, captureLead } from '@/lib/email.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = body?.email;
    const auditId = body?.auditId;

    if (!email || !auditId) {
      return NextResponse.json(
        { error: 'Missing email or auditId' },
        { status: 400 }
      );
    }

    console.log("Request received:", { email, auditId });

    // 1. Fetch audit (safe)
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { project: true },
    });

    if (!audit) {
      console.log("Audit not found");
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // 2. Safe URL parsing
    let domain = 'unknown';
    try {
      domain = new URL(audit.url).hostname;
    } catch {
      console.log("Invalid URL:", audit.url);
    }

    // 3. Score
    const mobileScore = {
      overall: audit.overallScore ?? 0,
      performance: audit.performanceScore ?? 0,
      accessibility: audit.accessibilityScore ?? 0,
      bestPractices: audit.bestPracticesScore ?? 0,
      seo: audit.seoScore ?? 0,
    };

    // 4. EMAIL (IMPORTANT: don't crash API if it fails)
    try {
      await sendAuditReportEmail({
        to: email,
        url: audit.url,
        title: audit.project?.name || domain,
        domain,
        reportId: auditId,
        mobileScore,
        riskLevel: audit.riskLevel || 'UNKNOWN',
        executiveSummary: audit.businessImpact || '',
      });
    } catch (emailError) {
      console.log("Email failed:", emailError);
    }

    // 5. Lead capture (safe)
    try {
      await captureLead({
        email,
        url: audit.url,
        source: 'report_email',
        metadata: {
          auditId,
          score: mobileScore.overall,
          domain,
        },
      });
    } catch (leadError) {
      console.log("Lead capture failed:", leadError);
    }

    return NextResponse.json({
      success: true,
      message: "Report processed successfully",
    });

  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { error: 'Server crashed' },
      { status: 500 }
    );
  }
}