import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SomlengAiError, somlengAiPresetSpeech } from "@/lib/somlengAi";
import { persistGeneratedSpeech } from "@/lib/speechJobs";

export const maxDuration = 300;

const MAX_CHARS = 4500;
const ALLOWED_LANGUAGES = new Set(["km-KH", "en-US"]);

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

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

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const language =
      typeof body?.language === "string" && ALLOWED_LANGUAGES.has(body.language)
        ? body.language
        : "km-KH";

    if (!text) {
      return NextResponse.json({ detail: "Text is required" }, { status: 400 });
    }

    if (text.length > MAX_CHARS) {
      return NextResponse.json(
        { detail: `Text must be ${MAX_CHARS} characters or fewer` },
        { status: 400 },
      );
    }

    const { bytes, contentType } = await somlengAiPresetSpeech({ text, language });
    const ext = contentType.includes("wav") ? "wav" : "mp3";
    const filename = `speech.${ext}`;

    const jobId = await persistGeneratedSpeech({
      jobType: "tts",
      text,
      language,
      engine: "mms",
      filename,
      bytes,
      contentType,
    });

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${filename}"`,
    };
    if (jobId) headers["X-Job-Id"] = jobId;

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    if (error instanceof SomlengAiError) {
      return NextResponse.json({ detail: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "TTS failed";
    console.error("TTS error:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
