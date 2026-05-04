import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAuditReportEmail, captureLead } from '@/lib/email.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, auditId } = body;

    if (!email || !auditId) {
      return NextResponse.json(
        { error: 'Email and auditId are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ✅ STEP 1: respond immediately (THIS FIXES MOBILE ISSUE)
    const response = NextResponse.json({
      success: true,
      message: 'Report is being processed and will be sent shortly',
    });

    // ✅ STEP 2: move heavy work to background
    setImmediate(async () => {
      try {
        const audit = await prisma.audit.findUnique({
          where: { id: auditId },
          include: { project: true },
        });

        if (!audit) return;

        const url = audit.url;
        const domain = new URL(url).hostname;

        const mobileScore = {
          overall: audit.overallScore || 0,
          performance: audit.performanceScore || 0,
          accessibility: audit.accessibilityScore || 0,
          bestPractices: audit.bestPracticesScore || 0,
          seo: audit.seoScore || 0,
        };

        const emailResult = await sendAuditReportEmail({
          to: email,
          url,
          title: audit.project?.name || domain,
          domain,
          reportId: auditId,
          mobileScore,
          riskLevel: audit.riskLevel || 'UNKNOWN',
          executiveSummary: audit.businessImpact || 'Website analysis completed.',
        });

        if (!emailResult.success) {
          console.error('Email failed:', emailResult.error);
          return;
        }

        await captureLead({
          email,
          url,
          source: 'report_email',
          metadata: {
            auditId,
            score: mobileScore.overall,
            domain,
          },
        });

        await prisma.waitlist.upsert({
          where: { email: email.toLowerCase() },
          create: {
            email: email.toLowerCase(),
            status: 'PENDING',
          },
          update: {},
        });

      } catch (err) {
        console.error('Background processing error:', err);
      }
    });

    return response;

  } catch (error) {
    console.error('Email report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}