const DEFAULT_BASE_URL = "https://voxtts.online";
const MODEL = "voxcpm2";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90;

export class VoxttsError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "VoxttsError";
    this.status = status;
  }
}

function getConfig() {
  const apiKey = process.env.VOXTTS_API_KEY?.trim();
  if (!apiKey) {
    throw new VoxttsError(
      "Voice cloning is not configured — missing VOXTTS_API_KEY",
      503,
    );
  }

  const baseUrl = (process.env.VOXTTS_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );

  return { apiKey, baseUrl };
}

function authHeaders(apiKey: string, contentType?: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
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
  return `VoxTTS request failed (${res.status})`;
}

type CloneJobCreateResponse = {
  job_id?: string;
  id?: string;
  jobId?: string;
};

type CloneJobStatusResponse = {
  status?: string;
  state?: string;
  error?: string;
  message?: string;
  detail?: string;
};

function extractJobId(payload: CloneJobCreateResponse): string | null {
  if (typeof payload.job_id === "string" && payload.job_id) return payload.job_id;
  if (typeof payload.id === "string" && payload.id) return payload.id;
  if (typeof payload.jobId === "string" && payload.jobId) return payload.jobId;
  return null;
}

function normalizeStatus(payload: CloneJobStatusResponse): string {
  const raw = (payload.status || payload.state || "").toLowerCase();
  return raw;
}

function isTerminalSuccess(status: string): boolean {
  return (
    status === "completed" ||
    status === "complete" ||
    status === "succeeded" ||
    status === "success" ||
    status === "done" ||
    status === "ready"
  );
}

function isTerminalFailure(status: string): boolean {
  return (
    status === "failed" ||
    status === "error" ||
    status === "cancelled" ||
    status === "canceled"
  );
}

export async function createCloneJob(options: {
  text: string;
  referenceAudio: Blob;
  referenceFilename: string;
}): Promise<string> {
  const { apiKey, baseUrl } = getConfig();

  const form = new FormData();
  form.append("reference_audio", options.referenceAudio, options.referenceFilename);
  form.append("input", options.text);
  form.append("model", MODEL);
  form.append("voice_consent", "true");

  const res = await fetch(`${baseUrl}/v2/audio/clone/jobs`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: form,
  });

  if (!res.ok) {
    const detail = await readErrorDetail(res);
    const status = res.status === 401 || res.status === 403 ? 502 : res.status;
    throw new VoxttsError(detail, status >= 500 ? 502 : status);
  }

  const payload = (await res.json()) as CloneJobCreateResponse;
  const jobId = extractJobId(payload);
  if (!jobId) {
    throw new VoxttsError("VoxTTS did not return a job id", 502);
  }
  return jobId;
}

export async function getCloneJobStatus(jobId: string): Promise<CloneJobStatusResponse> {
  const { apiKey, baseUrl } = getConfig();

  const res = await fetch(`${baseUrl}/v2/audio/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: authHeaders(apiKey, "application/json"),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new VoxttsError(await readErrorDetail(res), 502);
  }

  return (await res.json()) as CloneJobStatusResponse;
}

export async function downloadCloneAudio(jobId: string): Promise<{
  bytes: Buffer;
  contentType: string;
}> {
  const { apiKey, baseUrl } = getConfig();

  const res = await fetch(
    `${baseUrl}/v2/audio/jobs/${encodeURIComponent(jobId)}/audio`,
    {
      method: "GET",
      headers: authHeaders(apiKey),
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new VoxttsError(await readErrorDetail(res), 502);
  }

  const contentType = res.headers.get("content-type") || "audio/mpeg";
  const arrayBuffer = await res.arrayBuffer();
  return { bytes: Buffer.from(arrayBuffer), contentType };
}

export async function cloneSpeechAndWait(options: {
  text: string;
  referenceAudio: Blob;
  referenceFilename: string;
}): Promise<{ bytes: Buffer; contentType: string }> {
  const jobId = await createCloneJob(options);

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const statusPayload = await getCloneJobStatus(jobId);
    const status = normalizeStatus(statusPayload);

    if (isTerminalSuccess(status)) {
      return downloadCloneAudio(jobId);
    }

    if (isTerminalFailure(status)) {
      const detail =
        statusPayload.error ||
        statusPayload.message ||
        statusPayload.detail ||
        "Voice cloning job failed";
      throw new VoxttsError(detail, 502);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new VoxttsError("Voice cloning timed out — please try again", 504);
}
