// Real file type from the first bytes. A browser's file.type is only a label the client chose, so it is never trusted on its own.

const ascii = (b: Buffer, from: number, to: number) => b.subarray(from, to).toString("latin1");

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

export function sniffImage(b: Buffer): ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  return null;
}

export type AudioKind = "webm" | "ogg" | "m4a" | "wav" | "flac" | "aiff" | "mpeg" | "aac";

export function sniffAudio(b: Buffer): AudioKind | null {
  if (b.length < 12) return null;
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "webm";
  if (ascii(b, 0, 4) === "OggS") return "ogg";
  if (ascii(b, 4, 8) === "ftyp") return "m4a";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WAVE") return "wav";
  if (ascii(b, 0, 4) === "fLaC") return "flac";
  if (ascii(b, 0, 4) === "FORM" && ascii(b, 8, 12) === "AIFF") return "aiff";
  if (ascii(b, 0, 3) === "ID3") return "mpeg";
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return (b[1] & 0x06) === 0 ? "aac" : "mpeg";
  return null;
}

/** Which real formats may carry each type a browser can declare (after `geminiAudioMime`). */
const COMPATIBLE: Record<string, AudioKind[]> = {
  "audio/webm": ["webm"],
  "audio/ogg": ["ogg"],
  "audio/opus": ["ogg", "webm"],
  "audio/m4a": ["m4a"],
  "audio/aac": ["aac", "m4a"],
  "audio/mp3": ["mpeg"],
  "audio/mpeg": ["mpeg"],
  "audio/wav": ["wav"],
  "audio/flac": ["flac"],
  "audio/aiff": ["aiff"],
};

/** True when the first bytes are a real audio format that matches the declared (already mapped) type. */
export function audioMatchesDeclared(declared: string, b: Buffer): boolean {
  const kind = sniffAudio(b);
  return kind !== null && (COMPATIBLE[declared] ?? []).includes(kind);
}
