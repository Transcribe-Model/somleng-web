import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const { data: job, error } = await supabase
      .from("transcription_jobs")
      .select("audio_path,engine")
      .eq("id", id)
      .single();

    if (error || !job || !job.audio_path) {
      return NextResponse.json({ detail: "Job or audio not found" }, { status: 404 });
    }

    // Proxy through Next so the browser does not need Tailscale access.
    const origin = req.nextUrl.origin;
    return NextResponse.json({
      url: `${origin}/api/jobs/${id}/audio`,
      expires_in: 3600,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get audio URL";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
