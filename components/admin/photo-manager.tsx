"use client";

import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { addPhotos, deletePhoto, setAlbumCover, updatePhotoCaption } from "@/app/admin/actions/media";
import { Uploader, type UploadedFile } from "@/components/uploader";
import { Button, cn } from "@/components/ui";

export function PhotoUploader({ albumId }: { albumId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [round, setRound] = useState(0);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-3">
      <Uploader key={round} label="Add photos" multiple max={150} maxDim={2400} folder="gallery" capture onChange={setFiles} />
      {files.length > 0 && (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const n = await addPhotos(
                albumId,
                files.map((f) => ({ key: f.key, size: f.size, width: f.width, height: f.height })),
              );
              setMessage(`${n} photos added.`);
              setFiles([]);
              setRound((r) => r + 1);
            })
          }
        >
          {pending ? "Adding…" : `Add ${files.length} uploaded photo${files.length > 1 ? "s" : ""} to album`}
        </Button>
      )}
      {message && <p className="text-sm font-semibold text-green-900">{message}</p>}
    </div>
  );
}

export function PhotoTile({
  photo,
  albumId,
  isCover,
}: {
  photo: { id: string; key: string; caption: string | null };
  albumId: string;
  isCover: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <li className={cn("overflow-hidden rounded-lg border bg-white", isCover ? "border-orange" : "border-line", pending && "opacity-50")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/files/${photo.key}`} alt="" className="aspect-square w-full object-cover" loading="lazy" />
      <div className="space-y-1 p-1.5">
        <input
          defaultValue={photo.caption ?? ""}
          placeholder="Caption"
          className="w-full rounded border border-line px-1.5 py-1 text-xs"
          onBlur={(e) => {
            if (e.target.value !== (photo.caption ?? "")) start(() => updatePhotoCaption(photo.id, e.target.value));
          }}
        />
        <div className="flex justify-between">
          <button
            type="button"
            title="Use as cover"
            onClick={() => start(() => setAlbumCover(albumId, photo.key).then(() => undefined))}
            className={cn("p-1", isCover ? "text-orange" : "text-muted hover:text-orange")}
          >
            <Star className={cn("size-4", isCover && "fill-current")} />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={() => confirm("Delete this photo?") && start(() => deletePhoto(photo.id).then(() => undefined))}
            className="p-1 text-muted hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
