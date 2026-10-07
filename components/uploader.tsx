"use client";

import { useRef, useState } from "react";
import { Camera, FileText, ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { cn } from "@/components/ui";

export type UploadedFile = {
  key: string;
  mimeType: string;
  size: number;
  fileName?: string;
  width?: number;
  height?: number;
  /** Local preview URL (images only). */
  preview?: string;
};

type Item = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  result?: UploadedFile;
  preview?: string;
  file: File;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Downscale large photos in the browser before upload (keeps uploads fast on venue networks). */
export async function compressImage(file: File, maxDim = 1800, quality = 0.82): Promise<{ file: File; width?: number; height?: number }> {
  if (!file.type.startsWith("image/")) return { file };
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    if (scale === 1 && IMAGE_TYPES.includes(file.type) && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return { file, width, height };
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (!blob) return { file };
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return { file: new File([blob], name, { type: "image/jpeg" }), width, height };
  } catch {
    // The browser could not decode it (e.g. HEIC on Android); send the original.
    return { file };
  }
}

function uploadWithProgress(form: FormData, onProgress: (p: number) => void) {
  return new Promise<UploadedFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: { error?: string } & Partial<UploadedFile> = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body.key) resolve(body as UploadedFile);
      else reject(new Error(body.error ?? "Upload failed. Check your connection and retry."));
    };
    xhr.onerror = () => reject(new Error("Network error. Check your connection and retry."));
    xhr.send(form);
  });
}

/**
 * Mobile-first file picker with camera capture, client-side compression,
 * progress and retry. Calls onChange with the list of uploaded files.
 */
export function Uploader({
  label,
  accept = "image",
  capture = false,
  multiple = false,
  max = 6,
  code,
  claim,
  folder,
  maxDim,
  onChange,
  compact = false,
}: {
  label: string;
  accept?: "image" | "document" | "any";
  capture?: boolean;
  multiple?: boolean;
  max?: number;
  code?: string;
  claim?: string;
  folder?: string;
  maxDim?: number;
  onChange: (files: UploadedFile[]) => void;
  compact?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);

  const acceptAttr =
    accept === "image"
      ? "image/*"
      : accept === "document"
        ? ".pdf,.doc,.docx,.ppt,.pptx,application/pdf"
        : "image/*,.pdf,.doc,.docx,.ppt,.pptx,application/pdf";

  function commit(next: Item[]) {
    itemsRef.current = next;
    setItems(next);
    onChange(next.filter((i) => i.status === "done" && i.result).map((i) => i.result!));
  }

  function patch(id: string, update: Partial<Item>) {
    commit(itemsRef.current.map((i) => (i.id === id ? { ...i, ...update } : i)));
  }

  async function start(item: Item) {
    patch(item.id, { status: "uploading", progress: 0, error: undefined });
    try {
      const { file, width, height } = await compressImage(item.file, maxDim);
      const form = new FormData();
      form.set("file", file);
      if (code) form.set("code", code);
      if (claim) form.set("claim", claim);
      if (folder) form.set("folder", folder);
      const result = await uploadWithProgress(form, (p) => patch(item.id, { progress: p }));
      patch(item.id, { status: "done", progress: 1, result: { ...result, width, height, preview: item.preview } });
    } catch (error) {
      patch(item.id, { status: "error", error: (error as Error).message });
    }
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const room = max - itemsRef.current.length;
    const files = Array.from(list).slice(0, multiple ? Math.max(room, 0) : 1);
    const created: Item[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      progress: 0,
      status: "uploading",
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    commit(multiple ? [...itemsRef.current, ...created] : created);
    created.forEach(start);
  }

  function remove(id: string) {
    commit(itemsRef.current.filter((i) => i.id !== id));
  }

  const full = items.length >= (multiple ? max : 1);

  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{label}</div>
      {!full && (
        <div className={cn("grid gap-2", capture && accept !== "document" ? "grid-cols-2" : "grid-cols-1")}>
          {capture && accept !== "document" && (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-[var(--radius-control)] border-2 border-dashed border-green-800/40 bg-green-100/50 px-3 py-4 font-heading font-bold text-green-900 hover:bg-green-100"
            >
              <Camera className="size-5" /> Take photo
            </button>
          )}
          <button
            type="button"
            onClick={() => pickRef.current?.click()}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--radius-control)] border-2 border-dashed border-line bg-white px-3 font-heading font-bold text-ink hover:border-green-800",
              compact ? "py-2.5" : "py-4",
            )}
          >
            {accept === "document" ? <FileText className="size-5" /> : <ImagePlus className="size-5" />}
            {accept === "document" ? "Choose file" : capture ? "From phone" : "Choose files"}
          </button>
        </div>
      )}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={pickRef}
        type="file"
        accept={acceptAttr}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="relative overflow-hidden rounded-[var(--radius-control)] border border-line bg-white">
              {item.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.preview} alt="" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-cream-dark p-2 text-center text-xs text-muted">
                  <FileText className="mr-1 size-4 shrink-0" />
                  <span className="line-clamp-2 break-all">{item.name}</span>
                </div>
              )}
              {item.status === "uploading" && (
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/60 px-2 py-1 text-xs text-white">
                  <Loader2 className="size-3.5 animate-spin" />
                  {Math.round(item.progress * 100)}%
                </div>
              )}
              {item.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-danger/85 p-2 text-center text-xs text-white">
                  <span>{item.error}</span>
                  <button type="button" onClick={() => start(item)} className="inline-flex items-center gap-1 font-bold underline">
                    <RotateCcw className="size-3.5" /> Retry
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                aria-label={`Remove ${item.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
