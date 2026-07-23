export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Segment {
  start: number | null;
  end: number | null;
  text: string;
  speaker?: string | null;
}

export interface TranscribeResponse {
  engine: string;
  model: string | null;
  text: string;
  language: string | null;
  segments: Segment[];
  audio_path: string | null;
  duration_seconds: number | null;
}

export interface JobCreateResponse {
  id: string;
  status: JobStatus;
}

export interface JobResponse {
  id: string;
  status: JobStatus;
  language: string | null;
  model: string | null;
  original_filename: string | null;
  duration_seconds: number | null;
  engine: string;
  text: string | null;
  segments: Segment[];
  error_message: string | null;
  progress_percent: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface JobSummary {
  id: string;
  status: JobStatus;
  language: string | null;
  original_filename: string | null;
  duration_seconds: number | null;
  text_preview: string | null;
  has_audio: boolean;
  progress_percent: number;
  created_at: string | null;
}

export interface JobListResponse {
  jobs: JobSummary[];
  total: number;
}

export interface AudioUrlResponse {
  url: string;
  expires_in: number;
}

export interface HealthResponse {
  status: string;
  gcp: boolean;
  supabase: boolean;
  storage?: boolean;
  diarization?: boolean;
  gcp_model: string;
  gcp_language: string;
  available_gcp_models: string[];
}
