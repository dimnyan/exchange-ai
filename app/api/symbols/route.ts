import prisma from "@/lib/prisma";
import {NextResponse} from "next/server";
import {APIResponse} from "@/model";
import {Symbols} from "@/model/symbols";

export async function GET(): Promise<NextResponse<APIResponse<Symbols[]>>> {
  try {
    const symbols: Symbols[] = await prisma.symbol.findMany({
      take: 10
    });
    return NextResponse.json({data: symbols, status: 200, message: "Success"});
  } catch (error: any) {
    // CRITICAL: Log full error for debugging
    // console.error('Prisma Query Error:', {
    //   message: error.message,
    //   code: error.code,
    //   meta: error.meta,
    //   stack: error.stack,
    // });
    return NextResponse.json(
      {
        status: 500,
        data: null,
        message: error.message,
        // Remove in production
        // debug: process.env.NODE_ENV === 'development' ? error.message : undefined,}
      }
    );
  }
}