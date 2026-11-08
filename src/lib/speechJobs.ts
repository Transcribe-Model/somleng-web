import { createClient } from "@supabase/supabase-js";
import { somlengAiUploadFile } from "@/lib/somlengAi";

export type SpeechJobType = "tts" | "clone";

function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Upload generated audio to Somleng AI files and insert a completed History row.
 * Failures are logged; callers should still return audio to the user.
 */
export async function persistGeneratedSpeech(options: {
  jobType: SpeechJobType;
  text: string;
  language: string;
  engine: string;
  filename: string;
  bytes: Buffer;
  contentType: string;
}): Promise<string | null> {
  const supabase = serviceClient();
  if (!supabase) {
    console.warn("persistGeneratedSpeech: Supabase not configured");
    return null;
  }

  try {
    const blob = new Blob([new Uint8Array(options.bytes)], {
      type: options.contentType || "audio/wav",
    });
    const uploaded = await somlengAiUploadFile(blob, options.filename);

    const { data, error } = await supabase
      .from("transcription_jobs")
      .insert({
        status: "completed",
        job_type: options.jobType,
        language: options.language,
        model: options.engine,
        engine: options.engine,
        original_filename: options.filename,
        audio_path: uploaded.id || uploaded.audio_path,
        text: options.text,
        segments: [],
        enable_diarization: false,
        error_message: null,
        progress_percent: 100,
      })
      .select("id")
      .single();

    if (error) {
      console.error("persistGeneratedSpeech insert failed:", error);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.error("persistGeneratedSpeech failed:", error);
    return null;
  }
}
