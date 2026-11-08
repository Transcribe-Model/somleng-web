import { NextRequest, NextResponse } from "next/server";
import { VoxttsError, cloneSpeechAndWait } from "@/lib/voxtts";
import { persistGeneratedSpeech } from "@/lib/speechJobs";
import { requireUser } from "@/lib/requireUser";
import { serviceClient } from "@/lib/savedVoices";
import { somlengAiFetchFile } from "@/lib/somlengAi";

export const maxDuration = 800;

const MAX_CHARS = 1000;
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
    const savedVoiceIdRaw = form.get("saved_voice_id");
    const persistRaw = form.get("persist");
    const reference = form.get("reference_audio");
    const shouldPersist =
      persistRaw !== "false" &&
      persistRaw !== "0" &&
      persistRaw !== "no";

    const text = typeof textRaw === "string" ? textRaw.trim() : "";
    const language =
      typeof languageRaw === "string" && ALLOWED_LANGUAGES.has(languageRaw)
        ? languageRaw
        : "km-KH";
    const savedVoiceId =
      typeof savedVoiceIdRaw === "string" ? savedVoiceIdRaw.trim() : "";

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

    let referenceAudio: Blob;
    let filename: string;

    if (savedVoiceId) {
      const supabase = serviceClient();
      if (!supabase) {
        return NextResponse.json(
          { detail: "Database not configured" },
          { status: 500 },
        );
      }

      const { data: voice, error } = await supabase
        .from("saved_voices")
        .select("id,audio_path,original_filename")
        .eq("id", savedVoiceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !voice?.audio_path) {
        return NextResponse.json(
          { detail: "Saved voice not found" },
          { status: 404 },
        );
      }

      const fetched = await somlengAiFetchFile(voice.audio_path);
      referenceAudio = new Blob([new Uint8Array(fetched.bytes)], {
        type: fetched.contentType || "audio/wav",
      });
      filename = voice.original_filename || "saved-voice.wav";
    } else if (reference instanceof File) {
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

      referenceAudio = reference;
      filename =
        reference.name ||
        `reference${extensionForType(contentType, reference.name || "")}`;
    } else {
      return NextResponse.json(
        { detail: "Reference audio or saved voice is required" },
        { status: 400 },
      );
    }

    void language;

    const { bytes, contentType: outputType } = await cloneSpeechAndWait({
      text,
      referenceAudio,
      referenceFilename: filename,
    });

    const dispositionExt = outputType.includes("wav")
      ? "wav"
      : outputType.includes("ogg")
        ? "ogg"
        : "mp3";
    const outName = `cloned-speech.${dispositionExt}`;

    const jobId = shouldPersist
      ? await persistGeneratedSpeech({
          jobType: "clone",
          text,
          language,
          engine: "voxcpm2",
          filename: outName,
          bytes,
          contentType: outputType,
        })
      : null;

    const headers: Record<string, string> = {
      "Content-Type": outputType,
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${outName}"`,
    };
    if (jobId) headers["X-Job-Id"] = jobId;

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers,
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
