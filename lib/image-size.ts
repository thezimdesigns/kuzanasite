import "server-only";
import sharp from "sharp";
import { getObject } from "@/lib/storage";

/** Pixel size of an uploaded image, read from storage. */
export async function storedImageSize(key: string) {
  const obj = await getObject(key);
  if (!obj) throw new Error("The uploaded image could not be found. Please upload it again.");
  const buffer = Buffer.from(await new Response(obj.body).arrayBuffer());
  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) throw new Error("That file is not a readable image.");
  // EXIF orientations 5-8 swap width and height when displayed.
  const swap = (meta.orientation ?? 1) >= 5;
  return {
    width: swap ? meta.height : meta.width,
    height: swap ? meta.width : meta.height,
  };
}
