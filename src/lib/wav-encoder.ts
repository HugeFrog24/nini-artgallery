/**
 * Client-side WAV encoding utilities.
 *
 * MediaRecorder outputs browser-specific codecs (webm/opus, ogg/opus, etc.).
 * Most audio LLMs work best with plain WAV, so we decode the browser blob
 * via AudioContext and re-encode it as 16-bit mono PCM WAV.
 */

/**
 * Convert any browser-recorded audio blob (webm, ogg, mp4 …) into a
 * 16-bit mono WAV blob at the original sample rate.
 */
export async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    await audioCtx.close();
  }

  // Down-mix to mono by averaging all channels.
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const mono = new Float32Array(length);

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += channelData[i] / numChannels;
    }
  }

  // Encode as 16-bit PCM WAV.
  const bytesPerSample = 2;
  const dataLength = length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // ---- RIFF header ----
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");

  // ---- fmt sub-chunk ----
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // ---- data sub-chunk ----
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write PCM samples (clamp to [-1, 1] then scale to int16).
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Convert a Blob to a raw base64 string (no `data:` prefix).
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Check whether a WAV blob produced by `blobToWav` is effectively silent.
 *
 * Reads the 16-bit PCM samples directly (no extra AudioContext), computes
 * the RMS energy in dBFS, and returns `true` if it falls below the
 * threshold.  Default –35 dBFS catches ambient room noise while letting
 * normal speech through (typically –12 to –20 dBFS).
 */
export async function isWavSilent(
  wavBlob: Blob,
  thresholdDb = -35,
): Promise<boolean> {
  const buffer = await wavBlob.arrayBuffer();
  const view = new DataView(buffer);

  const dataOffset = 44; // standard WAV header length
  const numSamples = (buffer.byteLength - dataOffset) / 2; // 16-bit = 2 bytes

  if (numSamples === 0) return true;

  let sumSquares = 0;
  for (let i = 0; i < numSamples; i++) {
    // Normalise int16 → [–1, 1]
    const sample = view.getInt16(dataOffset + i * 2, true) / 0x8000;
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / numSamples);
  const dbfs = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

  return dbfs < thresholdDb;
}

// ── internal helper ─────────────────────────────────────────────
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
