/**
 * Client for the self-hosted Somleng AI server on Tailscale (YOURMOM).
 */

const DEFAULT_BASE_URL = "https://yourmom.tail02a453.ts.net:8443";

export class SomlengAiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "SomlengAiError";
    this.status = status;
  }
}

export function getSomlengAiConfig() {
  const baseUrl = (
    process.env.SOMLENG_AI_BASE_URL ||
    process.env.VOICE_CLONE_BASE_URL ||
    process.env.VOXTTS_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");

  const apiKey = (
    process.env.SOMLENG_AI_API_KEY ||
    process.env.VOICE_CLONE_API_KEY ||
    process.env.VOXTTS_API_KEY ||
    ""
  ).trim();

  return { baseUrl, apiKey };
}

function authHeaders(apiKey: string, contentType?: string): HeadersInit {
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

async function readErrorDetail(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }
  return `Somleng AI request failed (${res.status})`;
}

export type SomlengAiHealth = {
  status: string;
  service?: string;
  device?: string;
  name?: string;
  vram_gb?: number;
  active_model?: string;
  stt_engine?: string;
  tts_engine?: string;
  clone_engine?: string;
  qwen_asr_model?: string;
  whisper_model?: string;
  voxcpm_model?: string;
  diarization?: boolean;
  disk_free_gb?: number;
};

export type SomlengAiTranscribeJob = {
  id: string;
  status: string;
  progress_percent?: number;
  file_id?: string;
  original_filename?: string | null;
  language?: string | null;
  text?: string | null;
  segments?: Array<{
    start: number | null;
    end: number | null;
    text: string;
    speaker?: string | null;
  }>;
  duration_seconds?: number | null;
  error?: string | null;
};

export async function somlengAiHealth(): Promise<SomlengAiHealth> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const res = await fetch(`${baseUrl}/health`, {
    headers: authHeaders(apiKey),
    cache: "no-store",
  });
  if (!res.ok) throw new SomlengAiError(await readErrorDetail(res), res.status);
  return (await res.json()) as SomlengAiHealth;
}

export async function somlengAiUploadFile(
  file: Blob,
  filename: string,
): Promise<{ id: string; filename: string; size: number; audio_path: string }> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const form = new FormData();
  form.append("file", file, filename);

  const res = await fetch(`${baseUrl}/v1/files`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: form,
  });
  if (!res.ok) throw new SomlengAiError(await readErrorDetail(res), res.status);
  return (await res.json()) as {
    id: string;
    filename: string;
    size: number;
    audio_path: string;
  };
}

export async function somlengAiDeleteFile(fileId: string): Promise<void> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const res = await fetch(`${baseUrl}/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: authHeaders(apiKey),
  });
  if (!res.ok && res.status !== 404) {
    throw new SomlengAiError(await readErrorDetail(res), res.status);
  }
}

export async function somlengAiFetchFile(fileId: string): Promise<{
  bytes: Buffer;
  contentType: string;
}> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const res = await fetch(`${baseUrl}/v1/files/${encodeURIComponent(fileId)}`, {
    headers: authHeaders(apiKey),
    cache: "no-store",
  });
  if (!res.ok) throw new SomlengAiError(await readErrorDetail(res), res.status);
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  return { bytes: Buffer.from(await res.arrayBuffer()), contentType };
}

export async function somlengAiStartTranscribe(options: {
  fileId: string;
  language?: string;
}): Promise<{ id: string; status: string; file_id: string }> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const form = new FormData();
  form.append("file_id", options.fileId);
  form.append("language", options.language || "km-KH");

  const res = await fetch(`${baseUrl}/v1/audio/transcribe/jobs`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: form,
  });
  if (!res.ok) throw new SomlengAiError(await readErrorDetail(res), res.status);
  return (await res.json()) as { id: string; status: string; file_id: string };
}

export async function somlengAiGetTranscribeJob(
  jobId: string,
): Promise<SomlengAiTranscribeJob> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const res = await fetch(
    `${baseUrl}/v1/audio/transcribe/jobs/${encodeURIComponent(jobId)}`,
    {
      headers: authHeaders(apiKey),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new SomlengAiError(await readErrorDetail(res), res.status);
  return (await res.json()) as SomlengAiTranscribeJob;
}

export async function somlengAiPresetSpeech(options: {
  text: string;
  language?: string;
}): Promise<{ bytes: Buffer; contentType: string }> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const form = new FormData();
  form.append("text", options.text);
  form.append("language", options.language || "km-KH");

  const res = await fetch(`${baseUrl}/v1/audio/speech`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: form,
  });
  if (!res.ok) throw new SomlengAiError(await readErrorDetail(res), res.status);
  const contentType = res.headers.get("content-type") || "audio/wav";
  return { bytes: Buffer.from(await res.arrayBuffer()), contentType };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clone via async jobs so Tailscale Serve does not kill long GPU generates
 * (sync /v1/audio/clone often returns 502 around ~3 minutes).
 */
export async function somlengAiCloneSpeech(options: {
  text: string;
  referenceAudio: Blob;
  referenceFilename: string;
}): Promise<{ bytes: Buffer; contentType: string }> {
  const { baseUrl, apiKey } = getSomlengAiConfig();
  const form = new FormData();
  form.append("input", options.text);
  form.append("voice_consent", "true");
  form.append(
    "reference_audio",
    options.referenceAudio,
    options.referenceFilename,
  );

  const createRes = await fetch(`${baseUrl}/v2/audio/clone/jobs`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: form,
  });
  if (!createRes.ok) {
    throw new SomlengAiError(await readErrorDetail(createRes), createRes.status);
  }

  const created = (await createRes.json()) as { job_id?: string };
  const jobId = created.job_id?.trim();
  if (!jobId) {
    throw new SomlengAiError("Clone job did not return an id", 502);
  }

  const deadline = Date.now() + 12 * 60_000;
  while (Date.now() < deadline) {
    await sleep(2000);

    const statusRes = await fetch(
      `${baseUrl}/v2/audio/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: authHeaders(apiKey),
        cache: "no-store",
      },
    );
    if (!statusRes.ok) {
      throw new SomlengAiError(await readErrorDetail(statusRes), statusRes.status);
    }

    const job = (await statusRes.json()) as {
      status?: string;
      error?: string | null;
    };

    if (job.status === "failed") {
      throw new SomlengAiError(job.error || "Clone failed", 500);
    }

    if (job.status === "completed") {
      const audioRes = await fetch(
        `${baseUrl}/v2/audio/jobs/${encodeURIComponent(jobId)}/audio`,
        {
          headers: authHeaders(apiKey),
          cache: "no-store",
        },
      );
      if (!audioRes.ok) {
        throw new SomlengAiError(await readErrorDetail(audioRes), audioRes.status);
      }
      const contentType = audioRes.headers.get("content-type") || "audio/wav";
      return { bytes: Buffer.from(await audioRes.arrayBuffer()), contentType };
    }
  }

  throw new SomlengAiError(
    "Clone timed out — try a shorter sentence, then retry",
    504,
  );
}
