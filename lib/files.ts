/** Public URL for a stored object, served through the app at /files/... */
export function fileUrl(key: string | null | undefined, downloadName?: string | null) {
  if (!key) return null;
  const url = `/files/${key}`;
  return downloadName ? `${url}?name=${encodeURIComponent(downloadName)}` : url;
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
