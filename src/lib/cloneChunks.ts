/** Soft-split long clone scripts so each GPU run stays short on RTX 2050. */

const BREAK_CHARS = new Set(["។", "៕", "!", "?", ".", "\n", "；", ";", "…"]);

export function splitCloneText(
  text: string,
  targetChars = 280,
  maxChars = 360,
): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChars) return [cleaned];

  const chunks: string[] = [];
  let rest = cleaned;

  while (rest.length > 0) {
    if (rest.length <= maxChars) {
      chunks.push(rest.trim());
      break;
    }

    const window = rest.slice(0, maxChars);
    let cut = -1;

    // Prefer a break near the target length.
    for (let i = Math.min(window.length - 1, maxChars - 1); i >= Math.floor(targetChars * 0.55); i--) {
      if (BREAK_CHARS.has(window[i]!)) {
        cut = i + 1;
        break;
      }
    }

    // Fallback: break on space if present.
    if (cut < 0) {
      const space = window.lastIndexOf(" ");
      if (space >= Math.floor(targetChars * 0.45)) cut = space + 1;
    }

    if (cut < 0) cut = Math.min(targetChars, window.length);

    const piece = rest.slice(0, cut).trim();
    if (piece) chunks.push(piece);
    rest = rest.slice(cut).trim();
  }

  return chunks.filter(Boolean);
}
