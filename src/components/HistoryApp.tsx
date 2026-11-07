"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteJob,
  fetchJob,
  fetchJobAudioUrl,
  fetchJobs,
  jobToTranscribeResponse,
} from "@/lib/api";
import type { JobSummary, TranscribeResponse } from "@/types/transcribe";
import { useLanguage } from "@/contexts/LanguageContext";
import { AudioPlayer } from "./AudioPlayer";
import { HistoryList } from "./HistoryList";
import { TranscriptResult } from "./TranscriptResult";

export function HistoryApp() {
  const { text: t } = useLanguage();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchJobs({ limit: 50 });
      setJobs(data.jobs);
    } catch {
      setJobs([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadJobDetail = useCallback(
    async (jobId: string) => {
      setDetailLoading(true);
      setError(null);
      setAudioUrl(null);
      setAudioFilename(null);

      try {
        const job = await fetchJob(jobId);
        setSelectedId(jobId);

        if (job.status === "completed") {
          setResult(jobToTranscribeResponse(job));
        } else if (job.status === "failed") {
          setResult(null);
          setError(job.error_message ?? t.transcriptionFailed);
        } else {
          setResult(null);
          setError(null);
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
    },
    [t.loadFailed, t.transcriptionFailed],
  );

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const hasActive = jobs.some(
      (job) => job.status === "queued" || job.status === "processing",
    );
    if (!hasActive) return;
    const id = window.setInterval(() => {
      void loadHistory(true);
      if (selectedId) void loadJobDetail(selectedId);
    }, 2500);
    return () => window.clearInterval(id);
  }, [jobs, selectedId, loadHistory, loadJobDetail]);

  async function handleDelete(job: JobSummary) {
    await deleteJob(job.id);
    if (selectedId === job.id) {
      setSelectedId(null);
      setResult(null);
      setAudioUrl(null);
      setAudioFilename(null);
      setError(null);
    }
    await loadHistory(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-bg lg:w-[22rem] lg:border-b-0 lg:border-r">
        <div className="border-b border-border px-5 py-5">
          <h1 className="khmer-text text-xl font-bold text-navy">{t.historyNav}</h1>
          <p className="khmer-text mt-1 text-sm text-text-muted">{t.historyPageSubtitle}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <HistoryList
            jobs={jobs}
            selectedId={selectedId}
            loading={loading}
            onSelect={(job) => {
              void loadJobDetail(job.id);
            }}
            onDelete={handleDelete}
          />
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-bg-subtle">
        <div className="border-b border-border bg-bg px-6 py-5">
          <h2 className="khmer-text text-lg font-semibold text-navy">
            {t.historyDetailTitle}
          </h2>
          <p className="khmer-text mt-1 text-sm text-text-muted">
            {t.historyDetailSubtitle}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {detailLoading ? (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
              <p className="khmer-text mt-4 text-sm text-text-muted">{t.loading}</p>
            </div>
          ) : error ? (
            <div className="khmer-text rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : result || audioUrl ? (
            <div className="space-y-6">
              {audioUrl && (
                <AudioPlayer src={audioUrl} filename={audioFilename} />
              )}
              {result && <TranscriptResult result={result} />}
            </div>
          ) : (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
              <p className="khmer-text text-base font-medium text-navy">
                {t.historyEmptyDetail}
              </p>
              <p className="khmer-text mt-1 max-w-sm text-sm text-text-muted">
                {t.historyEmptyDetailHint}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
