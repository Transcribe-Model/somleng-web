/** Decode + concatenate audio blobs, then encode a single WAV. */

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c]![i]!));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export async function concatAudioBlobs(
  blobs: Blob[],
  gapSeconds = 0.18,
): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error("No audio chunks to combine");
  }
  if (blobs.length === 1) return blobs[0]!;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();

  try {
    const decoded: AudioBuffer[] = [];
    for (const blob of blobs) {
      const ab = await blob.arrayBuffer();
      decoded.push(await ctx.decodeAudioData(ab.slice(0)));
    }

    const sampleRate = decoded[0]!.sampleRate;
    const numChannels = Math.max(...decoded.map((b) => b.numberOfChannels));
    const gapSamples = Math.max(0, Math.floor(gapSeconds * sampleRate));
    const totalLength =
      decoded.reduce((sum, b) => sum + b.length, 0) +
      gapSamples * Math.max(0, decoded.length - 1);

    const out = ctx.createBuffer(numChannels, totalLength, sampleRate);
    let offset = 0;

    for (let i = 0; i < decoded.length; i++) {
      const buf = decoded[i]!;
      for (let c = 0; c < numChannels; c++) {
        const dest = out.getChannelData(c);
        const src = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1));
        dest.set(src, offset);
      }
      offset += buf.length;
      if (i < decoded.length - 1) offset += gapSamples;
    }

    return audioBufferToWavBlob(out);
  } finally {
    await ctx.close().catch(() => undefined);
  }
}
