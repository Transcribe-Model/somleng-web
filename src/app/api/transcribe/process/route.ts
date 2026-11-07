import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SomlengAiError, somlengAiStartTranscribe } from "@/lib/somlengAi";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fileId = typeof body?.fileId === "string" ? body.fileId : body?.gcsFileName;
    const language = typeof body?.language === "string" ? body.language : "km-KH";
    const originalFilename =
      typeof body?.originalFilename === "string" ? body.originalFilename : null;

    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json({ detail: "No fileId provided" }, { status: 400 });
    }

    const remote = await somlengAiStartTranscribe({
      fileId,
      language,
    });

    const { data: job, error } = await supabase
      .from("transcription_jobs")
      .insert({
        status: "processing",
        language,
        model: process.env.WHISPER_MODEL || "whisper-small-khmer",
        audio_path: fileId,
        original_filename: originalFilename,
        engine: "local",
        enable_diarization: false,
        // Store remote job id while processing (same hack used for GCP op name)
        error_message: `local:${remote.id}`,
        progress_percent: 10,
      })
      .select()
      .single();

    if (error || !job) {
      console.error("Supabase error:", error);
      return NextResponse.json({ detail: "Failed to save job" }, { status: 500 });
    }

    return NextResponse.json({ id: job.id, status: job.status });
  } catch (error: unknown) {
    if (error instanceof SomlengAiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Process failed";
    console.error("Process error:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
