import type { Metadata } from "next";
import { CmsPage } from "@/components/public/cms-page";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How KUZANA SCEEZ collects, uses and protects personal information, in line with Zimbabwe's Cyber and Data Protection Act.",
};

export default function PrivacyPage() {
  return <CmsPage slug="privacy" />;
}
