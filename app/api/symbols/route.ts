import prisma from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function GET() {
  try {
    const symbols = await prisma.symbols.findMany();
    return NextResponse.json({ symbols: symbols });
  } catch (error: any) {
    // CRITICAL: Log full error for debugging
    console.error('Prisma Query Error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch symbols',
        // Remove in production
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}