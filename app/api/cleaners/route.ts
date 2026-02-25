import { NextResponse } from "next/server";
import { getCleaners, createCleaner } from "@/lib/db";
import type { Cleaner } from "@/types";

export async function GET() {
  return NextResponse.json(getCleaners());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Cleaner;
  const cleaner = createCleaner(body);
  return NextResponse.json(cleaner, { status: 201 });
}
