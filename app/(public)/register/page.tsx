import type { Metadata } from "next";
import { VisitorRegistrationForm } from "@/components/public/visitor-registration-form";
import { PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Register as a visitor",
  description: "Register for KUZANA SCEEZ in under a minute and choose the updates you want.",
};

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        title="Register as a visitor"
        intro="Takes less than a minute. No account or password needed. Choose what you're interested in and how you'd like to hear from us."
      />
      <Section className="max-w-2xl">
        <VisitorRegistrationForm />
      </Section>
    </>
  );
}
