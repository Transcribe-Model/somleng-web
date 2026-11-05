import { NextRequest, NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const MAX_CHARS = 4500;
const ALLOWED_LANGUAGES = new Set(["km-KH", "en-US"]);

const VOICE_BY_LANGUAGE: Record<string, { languageCode: string; name: string }> = {
  "km-KH": { languageCode: "km-KH", name: "km-KH-Wavenet-A" },
  "en-US": { languageCode: "en-US", name: "en-US-Neural2-A" },
};

const gcpOptions: {
  credentials?: object;
  projectId?: string;
} = {};

if (process.env.GCP_CREDENTIALS_JSON) {
  gcpOptions.credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
  gcpOptions.projectId = process.env.GCP_PROJECT_ID;
}

const ttsClient = new TextToSpeechClient(gcpOptions);

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

    const voice = VOICE_BY_LANGUAGE[language];

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    });

    const audioContent = response.audioContent;
    if (!audioContent) {
      return NextResponse.json({ detail: "No audio generated" }, { status: 502 });
    }

    const bytes =
      typeof audioContent === "string"
        ? Buffer.from(audioContent, "base64")
        : Buffer.from(audioContent);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="speech.mp3"',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "TTS failed";
    console.error("TTS error:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
