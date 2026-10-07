import type { Metadata } from "next";
import { CmsPage } from "@/components/public/cms-page";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return <CmsPage slug="privacy" />;
}
