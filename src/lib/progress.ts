export function formatEtaSeconds(seconds: number): string {
  const total = Math.max(1, Math.ceil(seconds));
  if (total < 60) return `${total} វិនាទី`;
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  if (remainder === 0) return `${minutes} នាទី`;
  return `${minutes} នាទី ${remainder} វិនាទី`;
}

export function estimateRemainingSeconds(
  startedAt: number,
  percent: number,
  now = Date.now(),
): number | null {
  if (percent <= 2 || percent >= 100) return null;
  const elapsed = (now - startedAt) / 1000;
  if (elapsed < 1) return null;
  const total = elapsed / (percent / 100);
  return Math.max(1, total - elapsed);
}

export function resolveJobProgressPercent(
  status: "queued" | "processing" | "completed" | "failed",
  backendPercent: number,
): number {
  if (status === "queued") return Math.max(5, backendPercent);
  if (status === "processing") {
    return Math.max(10, Math.min(99, backendPercent || 10));
  }
  return backendPercent;
}
