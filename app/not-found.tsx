import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-4 text-[var(--text-muted)]">The page you are looking for does not exist.</p>
      <Button className="mt-8" asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
