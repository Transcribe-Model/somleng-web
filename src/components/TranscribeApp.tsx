"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteJob,
  fetchHealth,
  fetchJob,
  fetchJobAudioUrl,
  fetchJobs,
  jobToTranscribeResponse,
  pollJobUntilDone,
  transcribeUpload,
} from "@/lib/api";
import type { JobStatus, JobSummary, TranscribeResponse } from "@/types/transcribe";
import { useLanguage } from "@/contexts/LanguageContext";
import { AudioPlayer } from "./AudioPlayer";
import { HistorySidebar } from "./HistorySidebar";
import { JobProgress } from "./JobProgress";
import { TranscriptResult, formatTranscriptForCopy } from "./TranscriptResult";
import { UploadZone } from "./UploadZone";

export function TranscribeApp() {
  const { text: t, language: appLanguage } = useLanguage();
  const LANGUAGES = [
    { code: "km-KH", label: t.languageKhmer },
    { code: "en-US", label: t.languageEnglish },
  ];
  const [serviceOk, setServiceOk] = useState(true);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState("km-KH");
  const [enableDiarization, setEnableDiarization] = useState(false);
  const [diarizationReady, setDiarizationReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStartedAt, setJobStartedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<JobSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setHistoryLoading(true);
    try {
      const data = await fetchJobs({ limit: 50 });
      setHistory(data.jobs);
    } catch {
      setHistory([]);
    } finally {
      if (!silent) setHistoryLoading(false);
    }
  }, []);

  const loadJobDetail = useCallback(async (jobId: string) => {
    setDetailLoading(true);
    setError(null);
    setAudioUrl(null);
    setAudioFilename(null);

    try {
      const job = await fetchJob(jobId);
      setSelectedJobId(jobId);

      if (job.status === "completed") {
        setResult(jobToTranscribeResponse(job));
      } else if (job.status === "failed") {
        setResult(null);
        setError(job.error_message ?? t.transcriptionFailed);
      } else {
        setResult(null);
      }

      if (job.status === "completed" || job.status === "failed") {
        try {
          const audio = await fetchJobAudioUrl(jobId);
          setAudioUrl(audio.url);
          setAudioFilename(job.original_filename);
        } catch {
          setAudioUrl(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadFailed);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const h = await fetchHealth();
        const ready = h.gcp && h.supabase;
        setServiceOk(ready);
        setDiarizationReady(Boolean(h.diarization));
        if (!ready) {
          const missing = [
            !h.gcp && t.gcpMissing,
            !h.supabase && t.supabaseMissing,
          ].filter(Boolean);
          setServiceMessage(t.serviceNotReady(missing.join(", ")));
        } else {
          setServiceMessage(null);
          await loadHistory();
        }
        if (h.gcp_language) setLanguage(h.gcp_language);
      } catch {
        setServiceOk(false);
        setServiceMessage(t.apiUnreachable);
        setHistoryLoading(false);
      }
    }
    init();
  }, [loadHistory, t]);

  useEffect(() => {
    const hasActive = history.some(
      (job) => job.status === "queued" || job.status === "processing",
    );
    if (!hasActive && !historyOpen && !loading) return;

    const id = window.setInterval(() => {
      void loadHistory(true);
    }, 2000);

    return () => window.clearInterval(id);
  }, [history, historyOpen, loading, loadHistory]);

  const handleTranscribe = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAudioUrl(null);
    setAudioFilename(null);
    setSelectedJobId(null);
    setJobStatus("queued");
    setJobProgress(5);
    setJobStartedAt(Date.now());

    try {
      const { id } = await transcribeUpload(file, {
        language,
        enableDiarization,
      });
      setSelectedJobId(id);
      const job = await pollJobUntilDone(id, (updated) => {
        setJobStatus(updated.status);
        setJobProgress(updated.progress_percent ?? 0);
      });

      if (job.status === "failed") {
        throw new Error(job.error_message ?? t.transcriptionFailed);
      }

      setResult(jobToTranscribeResponse(job));
      await loadHistory();

      try {
        const audio = await fetchJobAudioUrl(id);
        setAudioUrl(audio.url);
        setAudioFilename(job.original_filename);
      } catch {
        setAudioUrl(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t.transcriptionFailed);
      setJobStatus(null);
      setJobProgress(0);
      setJobStartedAt(null);
      await loadHistory();
    } finally {
      setLoading(false);
      setJobProgress(0);
      setJobStartedAt(null);
    }
  }, [file, language, enableDiarization, loadHistory]);

  const handleSelectHistory = useCallback(
    (job: JobSummary) => {
      if (loading) return;
      loadJobDetail(job.id);
    },
    [loadJobDetail, loading],
  );

  const handleOpenHistory = useCallback(() => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    void loadHistory();
  }, [loadHistory]);

  const handleDeleteHistory = useCallback(
    async (job: JobSummary) => {
      try {
        await deleteJob(job.id);
        if (selectedJobId === job.id) {
          setSelectedJobId(null);
          setResult(null);
          setAudioUrl(null);
          setAudioFilename(null);
          setError(null);
        }
        await loadHistory(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.deleteFailed);
        throw e;
      }
    },
    [loadHistory, selectedJobId],
  );

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = formatTranscriptForCopy(result, t);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result, t]);

  const showRightLoading = loading || detailLoading;
  const showEmpty =
    !showRightLoading && !result && !error && !selectedJobId;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Left — upload */}
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-bg lg:w-[min(28rem,38vw)] lg:border-b-0 lg:border-r">
        <div className="border-b border-border px-6 py-5">
          <h2 className="khmer-text text-lg font-semibold text-navy">
            {t.uploadTitle}
          </h2>
          <p className="khmer-text mt-1 text-sm text-text-muted">
            {t.uploadSubtitle}
          </p>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
          <label className="block space-y-1.5">
            <span className="khmer-text text-sm font-medium text-text">{t.language}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              className="gov-input"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          {diarizationReady ? (
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={enableDiarization}
                disabled={loading}
                onChange={(e) => setEnableDiarization(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-navy focus:ring-navy"
              />
              <span className="min-w-0">
                <span className="khmer-text block text-sm font-medium text-text">
                  {t.detectSpeakers}
                </span>
                <span className="khmer-text mt-0.5 block text-xs text-text-muted">
                  {t.detectSpeakersHint}
                </span>
              </span>
            </label>
          ) : null}

          <UploadZone
            onFileSelect={setFile}
            disabled={loading}
            selectedFile={file}
          />

          <button
            type="button"
            onClick={handleTranscribe}
            disabled={!file || loading || !serviceOk}
            className="btn-primary"
          >
            {loading ? t.working : t.transcribe}
          </button>

          {!serviceOk && serviceMessage && (
            <div className="khmer-text rounded-[6px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {serviceMessage}
            </div>
          )}

          {loading && jobStatus && (
            <JobProgress
              status={jobStatus}
              progressPercent={jobProgress}
              startedAt={jobStartedAt}
            />
          )}
        </div>
      </aside>

      {/* Right — result */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-subtle">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-bg px-6 py-5">
          <div>
            <h2 className="khmer-text text-lg font-semibold text-navy">
              {t.resultTitle}
            </h2>
            <p className="khmer-text mt-1 text-sm text-text-muted">
              {t.resultSubtitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleOpenHistory}
              className="btn-secondary khmer-text shrink-0"
            >
              {t.historyTitle}
            </button>
          </div>
        </div>

        <HistorySidebar
          open={historyOpen}
          jobs={history}
          selectedId={selectedJobId}
          loading={historyLoading}
          onClose={() => setHistoryOpen(false)}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {showRightLoading && !result ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
              <p className="khmer-text mt-4 text-base font-medium text-navy">
                {loading ? t.transcribing : t.loading}
              </p>
              <p className="khmer-text mt-1 text-sm text-text-muted">
                {loading ? t.waitProcessing : t.loadingTranscription}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {audioUrl && (
                <AudioPlayer src={audioUrl} filename={audioFilename} />
              )}

              {error && (
                <div className="khmer-text rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {result ? (
                <TranscriptResult
                  result={result}
                  embedded
                  onCopy={handleCopy}
                  copied={copied}
                />
              ) : showEmpty ? (
                <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-[6px] border border-dashed border-border-strong bg-bg px-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-accent">
                    <svg
                      className="h-7 w-7 text-navy/50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <p className="khmer-text text-base font-medium text-navy">
                    {t.noResult}
                  </p>
                  <p className="khmer-text mt-1 max-w-sm text-sm text-text-muted">
                    {t.noResultHint}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
