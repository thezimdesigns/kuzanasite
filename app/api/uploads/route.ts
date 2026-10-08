import { NextResponse } from "next/server";
import { findValidClaim } from "@/lib/claim";
import { exhibitorCodeValid } from "@/lib/exhibitor-access";
import { getStaff } from "@/lib/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { putObject } from "@/lib/storage";
import { objectKey, validateUpload } from "@/lib/uploads";

/**
 * Single-file upload. Staff may upload anything allowed; the public exhibitor
 * form may upload only with a valid exhibitor access code.
 *
 * Form fields: file, scope ("exhibitor" | "staff"), code (public only).
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });

  const staff = await getStaff();
  let prefix: string;
  if (staff) {
    if (staff.role === "VIEWER" || staff.role === "QA_MODERATOR") return NextResponse.json({ error: "Read-only account." }, { status: 403 });
    prefix = `staff/${String(form.get("folder") ?? "misc").replace(/[^a-z-]/g, "") || "misc"}`;
  } else {
    const claim = form.get("claim") as string | null;
    const allowed = claim ? !!(await findValidClaim(claim)) : exhibitorCodeValid(form.get("code") as string | null);
    if (!allowed) {
      return NextResponse.json({ error: "This registration link is not valid." }, { status: 403 });
    }
    if (!(await rateLimit("upload", 60, 3600))) {
      return NextResponse.json({ error: "Too many uploads. Please wait and try again." }, { status: 429 });
    }
    prefix = "public/exhibitors";
  }

  try {
    const upload = await validateUpload(file);
    const key = objectKey(prefix, upload.ext);
    await putObject(key, upload.buffer, upload.mimeType);
    return NextResponse.json({
      key,
      mimeType: upload.mimeType,
      size: upload.size,
      fileName: file.name.slice(0, 200),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
