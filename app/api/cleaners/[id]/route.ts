import { NextResponse } from "next/server";
import { getCleanerById, updateCleaner } from "@/lib/db";
import type { Cleaner } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cleaner = getCleanerById(id);
  if (!cleaner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cleaner);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Partial<Cleaner>;
  const updated = updateCleaner(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
