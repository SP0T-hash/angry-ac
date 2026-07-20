import { NextResponse } from "next/server";
import { clearGSSession } from "@/lib/gs/session";

export async function POST() {
  await clearGSSession();
  return NextResponse.json({ ok: true });
}
