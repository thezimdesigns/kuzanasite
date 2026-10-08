import "server-only";
import { randomUUID } from "node:crypto";

type Rule = {
  ext: string;
  maxBytes: number;
  image: boolean;
  magic: (b: Buffer) => boolean;
};

const MB = 1024 * 1024;
const startsWith = (b: Buffer, bytes: number[]) => bytes.every((v, i) => b[i] === v);
const zip = (b: Buffer) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
const ole = (b: Buffer) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]);

export const UPLOAD_RULES: Record<string, Rule> = {
  "image/jpeg": {
    ext: "jpg",
    maxBytes: 20 * MB,
    image: true,
    magic: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  "image/png": {
    ext: "png",
    maxBytes: 20 * MB,
    image: true,
    magic: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]),
  },
  "image/webp": {
    ext: "webp",
    maxBytes: 20 * MB,
    image: true,
    magic: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  "application/pdf": {
    ext: "pdf",
    maxBytes: 30 * MB,
    image: false,
    magic: (b) => b.subarray(0, 4).toString("latin1") === "%PDF",
  },
  "application/msword": {
    ext: "doc",
    maxBytes: 30 * MB,
    image: false,
    magic: ole,
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    maxBytes: 30 * MB,
    image: false,
    magic: zip,
  },
  "application/vnd.ms-powerpoint": {
    ext: "ppt",
    maxBytes: 60 * MB,
    image: false,
    magic: ole,
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    ext: "pptx",
    maxBytes: 60 * MB,
    image: false,
    magic: zip,
  },
};

export type ValidatedUpload = {
  buffer: Buffer;
  mimeType: string;
  ext: string;
  size: number;
};

export async function validateUpload(file: File, opts: { imagesOnly?: boolean } = {}): Promise<ValidatedUpload> {
  const rule = UPLOAD_RULES[file.type];
  if (!rule) throw new Error("This file type is not supported. Use JPG, PNG, WebP, PDF, Word or PowerPoint.");
  if (opts.imagesOnly && !rule.image) throw new Error("Please choose an image (JPG, PNG or WebP).");
  if (file.size > rule.maxBytes) throw new Error(`File is too large (max ${rule.maxBytes / MB} MB).`);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!rule.magic(buffer)) throw new Error("The file content does not match its type.");
  return { buffer, mimeType: file.type, ext: rule.ext, size: buffer.length };
}

export function objectKey(prefix: string, ext: string) {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${prefix}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${ext}`;
}
