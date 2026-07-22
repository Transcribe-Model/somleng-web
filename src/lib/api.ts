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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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
  options?: { language?: string; model?: string; enableDiarization?: boolean },
): Promise<JobCreateResponse> {
  const form = new FormData();
  form.append("file", file);
  if (options?.language) form.append("language", options.language);
  if (options?.model) form.append("model", options.model);
  if (options?.enableDiarization) {
    form.append("enable_diarization", "true");
  }

  const res = await authFetch(`${API_URL}/transcribe/upload`, {
    method: "POST",
    body: form,
  });
  return handleResponse<JobCreateResponse>(res);
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
    speaker_count: job.speaker_count ?? null,
  };
}

export function formatTimestamp(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export { formatDateKm as formatDate, jobStatusLabel } from "@/lib/km";
