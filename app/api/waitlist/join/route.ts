import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const joinSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = joinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email, name } = result.data;

    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { 
          success: true, 
          message: "You're already on the waitlist!",
          status: existing.status,
          alreadyExists: true 
        },
        { status: 200 }
      );
    }

    // Create waitlist entry
    const entry = await prisma.waitlist.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "You're on the waitlist! We'll notify you when premium features launch.",
        status: entry.status 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist join error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
