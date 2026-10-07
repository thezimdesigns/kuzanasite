"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Uploader, type UploadedFile } from "@/components/uploader";

/**
 * Single-file upload bound to a hidden form field. `mode="key"` stores just the
 * object key; `mode="json"` stores {key,mimeType,size,fileName} for documents.
 */
export function UploadField({
  name,
  label,
  current,
  currentName,
  accept = "image",
  folder,
  mode = "key",
  maxDim,
}: {
  name: string;
  label: string;
  current?: string | null;
  currentName?: string | null;
  accept?: "image" | "document" | "any";
  folder: string;
  mode?: "key" | "json";
  maxDim?: number;
}) {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [cleared, setCleared] = useState(false);
  const value = file ? (mode === "json" ? JSON.stringify({ key: file.key, mimeType: file.mimeType, size: file.size, fileName: file.fileName }) : file.key) : cleared ? "" : mode === "key" ? (current ?? "") : "";

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      {current && !file && !cleared && (
        <div className="mb-2 flex items-center gap-3">
          {accept === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/files/${current}`} alt="" className="h-20 w-auto rounded border border-line bg-cream-dark object-contain" />
          ) : (
            <a href={`/files/${current}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-800 underline">
              <FileText className="size-4" /> {currentName ?? "Current file"}
            </a>
          )}
          {mode === "key" && (
            <button type="button" onClick={() => setCleared(true)} className="text-xs text-danger underline">
              Remove
            </button>
          )}
        </div>
      )}
      <Uploader label={label} accept={accept} folder={folder} maxDim={maxDim} compact onChange={(files) => setFile(files[0] ?? null)} />
    </div>
  );
}
