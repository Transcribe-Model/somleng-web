import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { somlengAiHealth } from "@/lib/somlengAi";

export async function GET() {
  const supabase = isSupabaseConfigured();
  let aiOk = false;
  let diarization = false;
  let aiModel = process.env.WHISPER_MODEL || "whisper-small-khmer";
  let aiLanguage = process.env.GCP_LANGUAGE_CODE || "km-KH";
  let activeModel: string | null = null;

  try {
    const h = await somlengAiHealth();
    aiOk = h.status === "ok";
    diarization = Boolean(h.diarization);
    if (h.whisper_model) aiModel = h.whisper_model;
    activeModel = h.active_model ?? null;
  } catch {
    aiOk = false;
  }

  return NextResponse.json({
    status: aiOk && supabase ? "ok" : "degraded",
    gcp: aiOk, // legacy field — UI still checks `gcp` for STT readiness
    supabase,
    storage: aiOk,
    diarization,
    gcp_model: aiModel,
    gcp_language: aiLanguage,
    engine: "local",
    active_model: activeModel,
    available_gcp_models: [aiModel],
  });
}
