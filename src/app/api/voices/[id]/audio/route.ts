import { NextRequest, NextResponse } from "next/server";
import { SomlengAiError, somlengAiFetchFile } from "@/lib/somlengAi";
import { requireUser } from "@/lib/requireUser";
import { serviceClient } from "@/lib/savedVoices";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ detail: "Database not configured" }, { status: 500 });
  }

  const { data: voice, error } = await supabase
    .from("saved_voices")
    .select("id,audio_path,original_filename")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !voice?.audio_path) {
    return NextResponse.json({ detail: "Voice not found" }, { status: 404 });
  }

  try {
    const { bytes, contentType } = await somlengAiFetchFile(voice.audio_path);
    const filename = voice.original_filename || "reference.wav";
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof SomlengAiError) {
      return NextResponse.json({ detail: err.message }, { status: err.status });
    }
    return NextResponse.json({ detail: "Failed to load voice audio" }, { status: 500 });
  }
}
