import { permanentRedirect } from "next/navigation";

/** Conferences are events; keep /conferences/[slug] as a stable alias. */
export default async function ConferenceAlias({ params }: PageProps<"/conferences/[slug]">) {
  const { slug } = await params;
  permanentRedirect(`/events/${slug}`);
}
