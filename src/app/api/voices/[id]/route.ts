import { NextRequest, NextResponse } from "next/server";
import { somlengAiDeleteFile } from "@/lib/somlengAi";
import { requireUser } from "@/lib/requireUser";
import { serviceClient } from "@/lib/savedVoices";

export async function DELETE(
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
    .select("id,audio_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !voice) {
    return NextResponse.json({ detail: "Voice not found" }, { status: 404 });
  }

  try {
    if (voice.audio_path) {
      await somlengAiDeleteFile(voice.audio_path);
    }
  } catch (err) {
    console.error("saved voice file delete:", err);
  }

  const { error: deleteError } = await supabase
    .from("saved_voices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ detail: "Failed to delete voice" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
