"use client";

import { Button } from "@/components/ui";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold text-green-900">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If it keeps happening, tell the technical team.</p>
      <Button type="button" className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
