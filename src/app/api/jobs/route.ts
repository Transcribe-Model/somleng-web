import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const { data: jobs, count, error } = await supabase
      .from("transcription_jobs")
      .select("id,status,language,original_filename,duration_seconds,created_at,audio_path,progress_percent,error_message,text", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ detail: "Failed to fetch jobs" }, { status: 500 });
    }

    const summaries = jobs?.map((job) => {
      let preview = job.original_filename;
      if (job.status === "failed" && job.error_message) {
        preview = job.error_message;
      }
      return {
        id: job.id,
        status: job.status,
        language: job.language,
        original_filename: job.original_filename,
        duration_seconds: job.duration_seconds,
        text_preview: job.text || preview,
        has_audio: !!job.audio_path,
        progress_percent: job.progress_percent || 0,
        created_at: job.created_at,
      };
    }) || [];

    return NextResponse.json({ jobs: summaries, total: count || summaries.length });
  } catch (error: any) {
    console.error("Jobs error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
