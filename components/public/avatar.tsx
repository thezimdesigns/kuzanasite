import Image from "next/image";
import { fileUrl } from "@/lib/files";

export function Avatar({ name, photoKey, size }: { name: string; photoKey: string | null; size: number }) {
  const src = fileUrl(photoKey);
  return src ? (
    <Image src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-green-100 font-heading font-bold text-green-900"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {name
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
