import "server-only";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Object storage. Production uses S3-compatible storage (Garage);
 * STORAGE_DRIVER=local writes to disk for development.
 */
const driver = process.env.STORAGE_DRIVER === "local" ? "local" : "s3";
const bucket = process.env.S3_BUCKET ?? "kuzana-media";
const localRoot = path.resolve(process.env.UPLOAD_DIR ?? ".uploads");

let s3: S3Client | null = null;
function client() {
  s3 ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "garage",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
  return s3;
}

function localPath(key: string) {
  const full = path.resolve(localRoot, key);
  if (!full.startsWith(localRoot + path.sep)) throw new Error("Invalid key");
  return full;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  if (driver === "local") {
    const file = localPath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    await writeFile(`${file}.type`, contentType);
    return;
  }
  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObject(key: string): Promise<{
  body: ReadableStream;
  contentType: string;
  size?: number;
} | null> {
  try {
    if (driver === "local") {
      const file = localPath(key);
      const info = await stat(file);
      const contentType = await readFile(`${file}.type`, "utf8").catch(() => "application/octet-stream");
      const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
      return { body, contentType, size: info.size };
    }
    const res = await client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!res.Body) return null;
    return {
      body: res.Body.transformToWebStream(),
      contentType: res.ContentType ?? "application/octet-stream",
      size: res.ContentLength,
    };
  } catch {
    return null;
  }
}

export async function deleteObject(key: string) {
  if (driver === "local") {
    await unlink(localPath(key)).catch(() => {});
    await unlink(`${localPath(key)}.type`).catch(() => {});
    return;
  }
  await client()
    .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    .catch(() => {});
}
