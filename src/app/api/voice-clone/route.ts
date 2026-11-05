import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { VoxttsError, cloneSpeechAndWait } from "@/lib/voxtts";

export const maxDuration = 300;

const MAX_CHARS = 4500;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const ALLOWED_LANGUAGES = new Set(["km-KH", "en-US"]);
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

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function extensionForType(type: string, fallbackName: string): string {
  const fromName = fallbackName.includes(".")
    ? fallbackName.slice(fallbackName.lastIndexOf("."))
    : "";
  if (fromName) return fromName;

  if (type.includes("wav")) return ".wav";
  if (type.includes("mpeg") || type.includes("mp3")) return ".mp3";
  if (type.includes("m4a") || type.includes("mp4")) return ".m4a";
  if (type.includes("ogg")) return ".ogg";
  if (type.includes("flac")) return ".flac";
  if (type.includes("webm")) return ".webm";
  return ".wav";
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const textRaw = form.get("text");
    const languageRaw = form.get("language");
    const consentRaw = form.get("voice_consent");
    const reference = form.get("reference_audio");

    const text = typeof textRaw === "string" ? textRaw.trim() : "";
    const language =
      typeof languageRaw === "string" && ALLOWED_LANGUAGES.has(languageRaw)
        ? languageRaw
        : "km-KH";

    const consent =
      consentRaw === "true" ||
      consentRaw === "1" ||
      consentRaw === "on" ||
      consentRaw === "yes";

    if (!text) {
      return NextResponse.json({ detail: "Text is required" }, { status: 400 });
    }

    if (text.length > MAX_CHARS) {
      return NextResponse.json(
        { detail: `Text must be ${MAX_CHARS} characters or fewer` },
        { status: 400 },
      );
    }

    if (!consent) {
      return NextResponse.json(
        { detail: "Voice consent is required to clone a voice" },
        { status: 400 },
      );
    }

    if (!(reference instanceof File)) {
      return NextResponse.json(
        { detail: "Reference audio is required" },
        { status: 400 },
      );
    }

    if (reference.size <= 0) {
      return NextResponse.json(
        { detail: "Reference audio file is empty" },
        { status: 400 },
      );
    }

    if (reference.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { detail: "Reference audio must be 10MB or smaller" },
        { status: 400 },
      );
    }

    const contentType = reference.type || "application/octet-stream";
    if (!ALLOWED_AUDIO_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          detail:
            "Unsupported reference audio type. Use MP3, WAV, M4A, FLAC, OGG, or WEBM.",
        },
        { status: 400 },
      );
    }

    const filename =
      reference.name ||
      `reference${extensionForType(contentType, reference.name || "")}`;

    // language is accepted for API symmetry with TTS; VoxTTS infers from text script
    void language;

    const { bytes, contentType: outputType } = await cloneSpeechAndWait({
      text,
      referenceAudio: reference,
      referenceFilename: filename,
    });

    const dispositionExt = outputType.includes("wav")
      ? "wav"
      : outputType.includes("ogg")
        ? "ogg"
        : "mp3";

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": outputType,
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="cloned-speech.${dispositionExt}"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof VoxttsError) {
      console.error("Voice clone VoxTTS error:", error.message);
      return NextResponse.json(
        { detail: error.message },
        { status: error.status },
      );
    }

    const message = error instanceof Error ? error.message : "Voice cloning failed";
    console.error("Voice clone error:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
