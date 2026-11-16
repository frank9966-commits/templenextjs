import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase keep-alive endpoint.
 * Called by Vercel Cron daily so the free-tier project doesn't pause.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "missing supabase env" },
      { status: 500 },
    );
  }

  const supabase = createClient(url, key);
  const { error } = await supabase.from("memberships").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
  });
}
