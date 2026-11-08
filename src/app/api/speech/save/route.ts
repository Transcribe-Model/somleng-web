import { NextRequest, NextResponse } from "next/server";
import { persistGeneratedSpeech } from "@/lib/speechJobs";
import { requireUser } from "@/lib/requireUser";

const MAX_BYTES = 40 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["tts", "clone"]);

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const textRaw = form.get("text");
    const languageRaw = form.get("language");
    const jobTypeRaw = form.get("job_type");
    const engineRaw = form.get("engine");
    const audio = form.get("audio");

    const text = typeof textRaw === "string" ? textRaw.trim() : "";
    const language =
      typeof languageRaw === "string" && languageRaw.trim()
        ? languageRaw.trim()
        : "km-KH";
    const jobType =
      typeof jobTypeRaw === "string" && ALLOWED_TYPES.has(jobTypeRaw)
        ? (jobTypeRaw as "tts" | "clone")
        : "clone";
    const engine =
      typeof engineRaw === "string" && engineRaw.trim()
        ? engineRaw.trim()
        : jobType === "tts"
          ? "mms"
          : "voxcpm2";

    if (!text) {
      return NextResponse.json({ detail: "Text is required" }, { status: 400 });
    }

    if (!(audio instanceof File)) {
      return NextResponse.json({ detail: "Audio is required" }, { status: 400 });
    }

    if (audio.size <= 0 || audio.size > MAX_BYTES) {
      return NextResponse.json(
        { detail: "Audio must be between 1 byte and 40MB" },
        { status: 400 },
      );
    }

    const contentType = audio.type || "audio/wav";
    const ext = contentType.includes("mpeg") || contentType.includes("mp3")
      ? "mp3"
      : contentType.includes("ogg")
        ? "ogg"
        : "wav";
    const filename =
      audio.name ||
      (jobType === "tts" ? `speech.${ext}` : `cloned-speech.${ext}`);

    const bytes = Buffer.from(await audio.arrayBuffer());
    const jobId = await persistGeneratedSpeech({
      jobType,
      text,
      language,
      engine,
      filename,
      bytes,
      contentType,
    });

    if (!jobId) {
      return NextResponse.json(
        { detail: "Failed to save audio to history" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: jobId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Save failed";
    console.error("POST /api/speech/save:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
