import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SomlengAiError, somlengAiFetchFile } from "@/lib/somlengAi";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const { data: job, error } = await supabase
      .from("transcription_jobs")
      .select("audio_path,original_filename,engine")
      .eq("id", id)
      .single();

    if (error || !job?.audio_path) {
      return NextResponse.json({ detail: "Job or audio not found" }, { status: 404 });
    }

    const { bytes, contentType } = await somlengAiFetchFile(job.audio_path);
    const filename = job.original_filename || "audio.bin";

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof SomlengAiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to fetch audio";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
