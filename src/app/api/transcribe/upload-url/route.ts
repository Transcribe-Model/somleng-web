import { NextResponse } from "next/server";

/** Legacy GCS signed-URL endpoint — replaced by POST /api/transcribe/upload */
export async function POST() {
  return NextResponse.json(
    {
      detail:
        "GCS uploads are disabled. Use POST /api/transcribe/upload (self-hosted Somleng AI).",
    },
    { status: 410 },
  );
}
