import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="py-16 text-center">
      <p className="font-heading text-5xl font-extrabold text-orange">404</p>
      <h1 className="mt-2 text-xl font-bold text-green-900">This item doesn&apos;t exist</h1>
      <p className="mt-1 text-sm text-muted">It may have been deleted.</p>
      <Link href="/admin" className="mt-4 inline-block font-semibold text-green-800 underline">
        Back to the dashboard
      </Link>
    </div>
  );
}
