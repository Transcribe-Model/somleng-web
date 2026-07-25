import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    gcp: true,
    supabase: true,
    storage: true,
    diarization: true,
    gcp_model: process.env.GCP_MODEL || "chirp_3",
    gcp_language: process.env.GCP_LANGUAGE_CODE || "km-KH",
  });
}
