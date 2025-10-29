import prisma from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function GET() {
  try {
    const symbols = await prisma.symbol.findMany({
      take: 10
    });
    return NextResponse.json({symbols: symbols});
  } catch (error: any) {


    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch symbols',
      },
      {status: 500}
    );
  }
}