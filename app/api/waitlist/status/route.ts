import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const entry = await prisma.waitlist.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        email: true,
        status: true,
        createdAt: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { onWaitlist: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      onWaitlist: true,
      status: entry.status,
      joinedAt: entry.createdAt,
    });
  } catch (error) {
    console.error('Waitlist status error:', error);
    return NextResponse.json(
      { error: 'Failed to check waitlist status' },
      { status: 500 }
    );
  }
}
