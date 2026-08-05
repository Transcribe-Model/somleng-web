import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v2 as speech } from "@google-cloud/speech";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

const location = process.env.GCP_LOCATION || "us";
const gcpOptions: any = location !== "global" ? { apiEndpoint: `${location}-speech.googleapis.com` } : {};

if (process.env.GCP_CREDENTIALS_JSON) {
  gcpOptions.credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
  gcpOptions.projectId = process.env.GCP_PROJECT_ID;
}

const speechClient = new speech.SpeechClient(gcpOptions);

export async function POST(req: NextRequest) {
  try {
    const { gcsFileName, language, model: reqModel, enableDiarization, originalFilename } = await req.json();

    if (!gcsFileName) {
      return NextResponse.json({ detail: "No gcsFileName provided" }, { status: 400 });
    }

    const bucketName = process.env.GCP_GCS_BUCKET;
    if (!bucketName) {
      return NextResponse.json({ detail: "GCP_GCS_BUCKET not configured" }, { status: 500 });
    }

    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || "us";
    const languageCode = language || process.env.GCP_LANGUAGE_CODE || "km-KH";
    const model = reqModel || process.env.GCP_MODEL || "chirp_3";

    const gcsUri = `gs://${bucketName}/${gcsFileName}`;

    // Trigger GCP BatchRecognize
    const recognizer = `projects/${projectId}/locations/${location}/recognizers/_`;
    const outputUri = `gs://${bucketName}/transcribe/output/`;

    const request = {
      recognizer,
      config: {
        autoDecodingConfig: {},
        languageCodes: [languageCode],
        model: model,
        features: {
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          // Native GCP Speaker Diarization
          ...(enableDiarization ? {
            diarizationConfig: {
              minSpeakerCount: 2,
              maxSpeakerCount: 6,
            }
          } : {})
        },
      },
      files: [{ uri: gcsUri }],
      recognitionOutputConfig: {
        gcsOutputConfig: { uri: outputUri },
      },
    };

    const [operation] = await speechClient.batchRecognize(request);

    // Save job in Supabase
    const { data: job, error } = await supabase
      .from("transcription_jobs")
      .insert({
        status: "processing",
        language: languageCode,
        model: model,
        audio_path: gcsFileName,
        original_filename: originalFilename,
        engine: "gcp",
        enable_diarization: enableDiarization,
        error_message: operation.name, // HACK: store operation name while processing
      })
      .select()
      .single();

    if (error || !job) {
      console.error("Supabase error:", error);
      return NextResponse.json({ detail: "Failed to save job" }, { status: 500 });
    }

    return NextResponse.json({ id: job.id, status: job.status });
  } catch (error: any) {
    console.error("Process error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
