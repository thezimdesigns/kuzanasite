import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KUZANA SCEEZ",
    short_name: "KUZANA",
    description: "Live programme, exhibitors and media for KUZANA SCEEZ.",
    start_url: "/live",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#00512d",
    icons: [{ src: "/brand/kuzana-icon.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
