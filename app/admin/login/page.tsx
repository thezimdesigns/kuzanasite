import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/permissions";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false },
};

export default async function LoginPage() {
  if (await getStaff()) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory-pattern px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-sm">
        <Image src="/brand/kuzana-sceez.png" alt="KUZANA SCEEZ" width={132} height={48} className="mb-4 h-12 w-auto" />
        <h1 className="text-xl font-extrabold text-green-900">Staff sign in</h1>
        <p className="mb-5 text-sm text-muted">KUZANA administration portal</p>
        <LoginForm />
      </div>
    </main>
  );
}
