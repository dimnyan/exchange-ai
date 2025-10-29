import prisma from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function GET() {
  try {
    // Test connection + lightweight query
    await prisma.$queryRaw`SELECT 1 AS connected`;

    return NextResponse.json(
      { status: 'healthy', message: 'Database connected successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}