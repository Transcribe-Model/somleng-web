/**
 * Voice clone client — proxies to self-hosted Somleng AI.
 */
import { SomlengAiError, somlengAiCloneSpeech } from "@/lib/somlengAi";

export class VoxttsError extends SomlengAiError {
  constructor(message: string, status = 502) {
    super(message, status);
    this.name = "VoxttsError";
  }
}

export async function cloneSpeechAndWait(options: {
  text: string;
  referenceAudio: Blob;
  referenceFilename: string;
}): Promise<{ bytes: Buffer; contentType: string }> {
  try {
    return await somlengAiCloneSpeech(options);
  } catch (error) {
    if (error instanceof SomlengAiError) {
      throw new VoxttsError(error.message, error.status);
    }
    if (error instanceof TypeError) {
      throw new VoxttsError(
        "Cannot reach Somleng AI voice clone server. Is Tailscale up?",
        503,
      );
    }
    throw error;
  }
}
