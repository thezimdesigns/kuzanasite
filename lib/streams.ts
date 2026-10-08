import { youtubeId } from "@/lib/youtube";

export type StreamLink = { id: string; label: string; url: string };

export type StreamEmbed = { kind: "youtube" | "facebook"; src: string } | null;

/**
 * Embeddable player for a stream link. YouTube (watch, live, youtu.be) uses the
 * privacy-enhanced domain; Facebook videos use the official video plugin.
 * Anything else (Zoom, X, TikTok, a radio stream page…) is shown as a link.
 */
export function streamEmbed(url: string): StreamEmbed {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m)\./, "");
  if (host === "youtube.com" || host === "youtu.be") {
    const id = youtubeId(url);
    return id
      ? {
          kind: "youtube",
          src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
        }
      : null;
  }
  if ((host === "facebook.com" || host === "fb.watch") && /\/videos?\/|\/watch|fb\.watch|\/live/.test(url)) {
    return {
      kind: "facebook",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
    };
  }
  return null;
}

export function streamHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
