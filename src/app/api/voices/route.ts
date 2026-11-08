import { NextRequest, NextResponse } from "next/server";
import { somlengAiUploadFile } from "@/lib/somlengAi";
import { requireUser } from "@/lib/requireUser";
import { serviceClient } from "@/lib/savedVoices";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_NAME = 80;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "application/octet-stream",
]);

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ detail: "Database not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("saved_voices")
    .select("id,name,audio_path,original_filename,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("saved_voices list error:", error);
    return NextResponse.json({ detail: "Failed to load voices" }, { status: 500 });
  }

  return NextResponse.json({ voices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ detail: "Database not configured" }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const nameRaw = form.get("name");
    const reference = form.get("reference_audio");
    const name =
      typeof nameRaw === "string" ? nameRaw.trim().slice(0, MAX_NAME) : "";

    if (!name) {
      return NextResponse.json({ detail: "Voice name is required" }, { status: 400 });
    }

    if (!(reference instanceof File)) {
      return NextResponse.json(
        { detail: "Reference audio is required" },
        { status: 400 },
      );
    }

    if (reference.size <= 0 || reference.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { detail: "Reference audio must be between 1 byte and 10MB" },
        { status: 400 },
      );
    }

    const contentType = reference.type || "application/octet-stream";
    if (!ALLOWED_AUDIO_TYPES.has(contentType)) {
      return NextResponse.json(
        { detail: "Unsupported reference audio type" },
        { status: 400 },
      );
    }

    const filename = reference.name || "reference.wav";
    const uploaded = await somlengAiUploadFile(reference, filename);

    const { data, error } = await supabase
      .from("saved_voices")
      .insert({
        user_id: user.id,
        name,
        audio_path: uploaded.id || uploaded.audio_path,
        original_filename: filename,
      })
      .select("id,name,audio_path,original_filename,created_at")
      .single();

    if (error || !data) {
      console.error("saved_voices insert error:", error);
      return NextResponse.json({ detail: "Failed to save voice" }, { status: 500 });
    }

    return NextResponse.json({ voice: data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save voice";
    console.error("POST /api/voices:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
