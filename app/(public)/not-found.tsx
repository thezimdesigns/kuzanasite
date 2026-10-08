import { NotFoundContent } from "@/components/public/not-found-content";

/** Shown when a public page calls notFound(): rendered inside the site layout. */
export default function PublicNotFound() {
  return <NotFoundContent />;
}
