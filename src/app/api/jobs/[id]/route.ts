import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v2 as speech } from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";

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
const storage = new Storage(gcpOptions.credentials ? { credentials: gcpOptions.credentials, projectId: gcpOptions.projectId } : undefined);
const bucketName = process.env.GCP_GCS_BUCKET!;

function durationToSeconds(offset: any): number {
  if (!offset) return 0;
  let secs = 0;
  if (offset.seconds) secs += parseInt(offset.seconds, 10);
  if (offset.nanos) secs += offset.nanos / 1e9;
  return secs;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const { data: job, error } = await supabase
      .from("transcription_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    if (job.status === "processing" && job.error_message?.startsWith("projects/")) {
      const opName = job.error_message;
      try {
        const [op] = await speechClient.operationsClient.getOperation({ name: opName } as any);
        let progress = 50;

        if (op.done) {
          if (op.error) {
            const { data: updated } = await supabase
              .from("transcription_jobs")
              .update({ status: "failed", error_message: op.error.message || "GCP Error", progress_percent: 0 })
              .eq("id", id)
              .select()
              .single();
            return NextResponse.json(updated);
          } else {
            const bucket = storage.bucket(bucketName);
            const outputPrefix = `transcribe/output/`;
            const [files] = await bucket.getFiles({ prefix: outputPrefix });
            const searchKey = job.audio_path.replace("transcribe/", "").replace(/\.[^/.]+$/, "");
            const jsonFile = files.find(f => f.name.endsWith(".json") && f.name.includes(searchKey));
            
            let fullText = "";
            let segments: any[] = [];
            let durationSeconds = 0;

            if (jsonFile) {
              const [contents] = await jsonFile.download();
              const resultData = JSON.parse(contents.toString("utf8"));
              
              if (resultData.results) {
                for (const res of resultData.results) {
                   const alts = res.alternatives || [];
                   if (alts.length > 0) {
                     const alt = alts[0];
                     fullText += (alt.transcript || "") + " ";
                     
                     const start = durationToSeconds(res.resultEndOffset || alts[0].words?.[0]?.startOffset);
                     const end = durationToSeconds(res.resultEndOffset || alts[0].words?.[alts[0].words.length - 1]?.endOffset);
                     
                     segments.push({
                       start,
                       end,
                       text: (alt.transcript || "").trim(),
                       speaker: null 
                     });
                     durationSeconds = end > durationSeconds ? end : durationSeconds;
                   }
                }
              }
            } else {
              throw new Error("Could not find GCS output JSON for the transcription.");
            }

            const { data: updated } = await supabase
              .from("transcription_jobs")
              .update({ 
                status: "completed", 
                text: fullText.trim(), 
                segments: segments,
                duration_seconds: durationSeconds,
                error_message: null, 
                progress_percent: 100 
              })
              .eq("id", id)
              .select()
              .single();
              
            return NextResponse.json(updated);
          }
        } else {
          const { data: updated } = await supabase
              .from("transcription_jobs")
              .update({ progress_percent: progress })
              .eq("id", id)
              .select()
              .single();
          return NextResponse.json(updated);
        }
      } catch (err: any) {
        console.error("GCP operation error:", err);
      }
    }

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const { data: job } = await supabase.from("transcription_jobs").select("audio_path").eq("id", id).single();
    
    if (job?.audio_path) {
      try {
        await storage.bucket(bucketName).file(job.audio_path).delete();
      } catch (e) {
        // ignore if not found
      }
    }

    const { error } = await supabase.from("transcription_jobs").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ detail: "Failed to delete" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
