import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-heading text-6xl font-extrabold text-orange">404</p>
      <h1 className="mt-3 text-2xl font-extrabold text-green-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved, or it hasn&apos;t been published yet.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/live" className="rounded-full bg-orange px-5 py-2.5 font-heading font-bold text-white">
          KUZANA Live
        </Link>
        <Link href="/" className="rounded-full border-2 border-green-900 px-5 py-2.5 font-heading font-bold text-green-900">
          Home
        </Link>
      </div>
    </main>
  );
}
