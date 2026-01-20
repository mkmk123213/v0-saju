import { NextResponse } from "next/server";

export async function GET() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return NextResponse.json({
    SUPABASE_SERVICE_ROLE_KEY: { present: !!service, len: service.length },
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
  });
}
