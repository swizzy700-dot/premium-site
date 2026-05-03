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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Fetch the audit
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        project: true,
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    // Get mobile score (primary)
    const mobileScore = {
      overall: audit.overallScore || 0,
      performance: audit.performanceScore || 0,
      accessibility: audit.accessibilityScore || 0,
      bestPractices: audit.bestPracticesScore || 0,
      seo: audit.seoScore || 0,
    };

    // Extract domain from URL
    const url = audit.url;
    const domain = new URL(url).hostname;

    // Send email
    const emailResult = await sendAuditReportEmail({
      to: email,
      url: url,
      title: audit.project?.name || domain,
      domain: domain,
      reportId: auditId,
      mobileScore,
      riskLevel: audit.riskLevel || 'UNKNOWN',
      executiveSummary: audit.businessImpact || 'Website analysis completed.',
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Capture lead for marketing
    await captureLead({
      email,
      url: url,
      source: 'report_email',
      metadata: {
        auditId,
        score: mobileScore.overall,
        domain,
      },
    });

    // Store email in waitlist if not already there
    try {
      await prisma.waitlist.upsert({
        where: { email: email.toLowerCase() },
        create: {
          email: email.toLowerCase(),
          status: 'PENDING',
        },
        update: {},
      });
    } catch (e) {
      // Ignore errors - email was still sent
      console.log('Waitlist entry creation skipped');
    }

    return NextResponse.json({
      success: true,
      message: 'Report sent successfully',
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Email report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
