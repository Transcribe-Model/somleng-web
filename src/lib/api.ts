import type {
  AudioUrlResponse,
  HealthResponse,
  JobCreateResponse,
  JobListResponse,
  JobResponse,
  JobStatus,
  TranscribeResponse,
} from "@/types/transcribe";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const API_URL = "/api";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function resolveAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  if (!isSupabaseConfigured()) return null;

  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token ?? null;
  if (token) accessToken = token;
  return token;
}

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = await resolveAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      body && typeof body.detail === "string"
        ? body.detail
        : `សំណើមិនបានសម្រេច (${res.status})`;
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
  return handleResponse<HealthResponse>(res);
}

export async function transcribeUpload(
  file: File,
  options?: {
    language?: string;
    model?: string;
    enableDiarization?: boolean;
  },
): Promise<JobCreateResponse> {
  // 1. Upload to self-hosted Somleng AI storage (via Next proxy)
  const form = new FormData();
  form.append("file", file, file.name);
  const uploadRes = await authFetch(`${API_URL}/transcribe/upload`, {
    method: "POST",
    body: form,
  });
  const uploaded = await handleResponse<{ fileId: string; audio_path: string }>(
    uploadRes,
  );

  // 2. Start local Whisper transcription job
  const processRes = await authFetch(`${API_URL}/transcribe/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileId: uploaded.fileId,
      originalFilename: file.name,
      language: options?.language,
      model: options?.model,
      enableDiarization: false,
    }),
  });
  return handleResponse<JobCreateResponse>(processRes);
}

export async function fetchJob(jobId: string): Promise<JobResponse> {
  const res = await authFetch(`${API_URL}/jobs/${jobId}`, { cache: "no-store" });
  return handleResponse<JobResponse>(res);
}

export async function fetchJobs(
  options?: { limit?: number; offset?: number },
): Promise<JobListResponse> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.offset != null) params.set("offset", String(options.offset));
  const qs = params.toString();
  const res = await authFetch(`${API_URL}/jobs${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });
  return handleResponse<JobListResponse>(res);
}

export async function fetchJobAudioUrl(jobId: string): Promise<AudioUrlResponse> {
  const res = await authFetch(`${API_URL}/jobs/${jobId}/audio-url`, {
    cache: "no-store",
  });
  return handleResponse<AudioUrlResponse>(res);
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await authFetch(`${API_URL}/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    await handleResponse(res);
  }
}

export async function synthesizeSpeech(
  text: string,
  language: string = "km-KH",
): Promise<Blob> {
  const res = await authFetch(`${API_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      body && typeof body.detail === "string"
        ? body.detail
        : `សំណើមិនបានសម្រេច (${res.status})`;
    throw new Error(detail);
  }

  return res.blob();
}

export async function cloneSpeech(
  text: string,
  referenceAudio: File | Blob,
  options?: {
    language?: string;
    voiceConsent?: boolean;
    filename?: string;
  },
): Promise<Blob> {
  const form = new FormData();
  form.append("text", text);
  form.append("language", options?.language ?? "km-KH");
  form.append("voice_consent", options?.voiceConsent === false ? "false" : "true");

  const filename =
    options?.filename ||
    (referenceAudio instanceof File && referenceAudio.name
      ? referenceAudio.name
      : "reference.webm");

  form.append("reference_audio", referenceAudio, filename);

  const res = await authFetch(`${API_URL}/voice-clone`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail =
      body && typeof body.detail === "string"
        ? body.detail
        : `សំណើមិនបានសម្រេច (${res.status})`;
    throw new Error(detail);
  }

  return res.blob();
}

export async function pollJobUntilDone(
  jobId: string,
  onUpdate?: (job: JobResponse) => void,
  intervalMs = 2000,
): Promise<JobResponse> {
  for (;;) {
    const job = await fetchJob(jobId);
    onUpdate?.(job);
    if (job.status === "completed" || job.status === "failed") {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export function jobToTranscribeResponse(job: JobResponse): TranscribeResponse {
  return {
    engine: job.engine,
    model: job.model,
    text: job.text ?? "",
    language: job.language,
    segments: job.segments,
    audio_path: null,
    duration_seconds: job.duration_seconds,
  };
}

export function formatTimestamp(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export { formatDateKm as formatDate, jobStatusLabel } from "@/lib/km";
