import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Storage } from "@google-cloud/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

let credentials;
if (process.env.GCP_CREDENTIALS_JSON) {
  credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
}

const storage = new Storage(credentials ? { credentials, projectId: process.env.GCP_PROJECT_ID } : undefined);
const bucketName = process.env.GCP_GCS_BUCKET!;

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const { data: job, error } = await supabase
      .from("transcription_jobs")
      .select("audio_path")
      .eq("id", id)
      .single();

    if (error || !job || !job.audio_path) {
      return NextResponse.json({ detail: "Job or audio not found" }, { status: 404 });
    }

    const file = storage.bucket(bucketName).file(job.audio_path);
    
    // Generate a signed URL that expires in 1 hour
    const expires = Date.now() + 60 * 60 * 1000;
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expires,
    });

    return NextResponse.json({ url, expires_in: 3600 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
