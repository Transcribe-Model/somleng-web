import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  SomlengAiError,
  somlengAiDeleteFile,
  somlengAiGetTranscribeJob,
} from "@/lib/somlengAi";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

function mapLocalStatus(status: string): "queued" | "processing" | "completed" | "failed" {
  const s = status.toLowerCase();
  if (s === "completed" || s === "complete" || s === "succeeded" || s === "done") {
    return "completed";
  }
  if (s === "failed" || s === "error") return "failed";
  if (s === "queued" || s === "pending") return "queued";
  return "processing";
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const remoteRef =
      typeof job.error_message === "string" && job.error_message.startsWith("local:")
        ? job.error_message.slice("local:".length)
        : null;

    if (
      (job.status === "processing" || job.status === "queued") &&
      remoteRef &&
      job.engine === "local"
    ) {
      try {
        const remote = await somlengAiGetTranscribeJob(remoteRef);
        const status = mapLocalStatus(remote.status);

        if (status === "completed") {
          const cleanText = (value: string | null | undefined) =>
            (value ?? "").replace(/\uFFFD/g, "").replace(/\s+/g, " ").trim();

          const segments = (remote.segments ?? []).map((seg) => ({
            ...seg,
            text: cleanText(seg.text),
          }));
          const text =
            cleanText(remote.text) ||
            cleanText(segments.map((s) => s.text).join(" "));

          const { data: updated } = await supabase
            .from("transcription_jobs")
            .update({
              status: "completed",
              text,
              segments,
              duration_seconds: remote.duration_seconds ?? null,
              error_message: null,
              progress_percent: 100,
            })
            .eq("id", id)
            .select()
            .single();
          return NextResponse.json(updated ?? { ...job, status: "completed" });
        }

        if (status === "failed") {
          const { data: updated } = await supabase
            .from("transcription_jobs")
            .update({
              status: "failed",
              error_message: remote.error || "Transcription failed",
              progress_percent: 0,
            })
            .eq("id", id)
            .select()
            .single();
          return NextResponse.json(updated ?? job);
        }

        const progress = remote.progress_percent ?? job.progress_percent ?? 20;
        const { data: updated } = await supabase
          .from("transcription_jobs")
          .update({
            status: "processing",
            progress_percent: progress,
            error_message: `local:${remoteRef}`,
          })
          .eq("id", id)
          .select()
          .single();
        return NextResponse.json(updated ?? job);
      } catch (err) {
        console.error("Local STT poll error:", err);
      }
    }

    return NextResponse.json(job);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load job";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const { data: job } = await supabase
      .from("transcription_jobs")
      .select("audio_path,engine")
      .eq("id", id)
      .single();

    if (job?.audio_path && job.engine === "local") {
      try {
        await somlengAiDeleteFile(job.audio_path);
      } catch (e) {
        if (!(e instanceof SomlengAiError && e.status === 404)) {
          console.error("Failed to delete local audio:", e);
        }
      }
    }

    const { error } = await supabase.from("transcription_jobs").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ detail: "Failed to delete" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
