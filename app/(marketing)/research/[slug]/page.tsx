import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { readMdxFile, getMdxSlugs } from "@/lib/mdx";
import { FooterDisclaimer } from "@/components/ui/disclaimer";

export async function generateStaticParams() {
  return getMdxSlugs("research").map((slug) => ({ slug }));
}

export default async function ResearchArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const source = readMdxFile("research", slug);
    return (
      <article className="prose prose-invert prose-headings:font-display mx-auto max-w-3xl px-4 py-16 prose-a:text-accent">
        <Link href="/research" className="text-sm text-[var(--text-muted)] no-underline hover:text-accent">
          ← Research library
        </Link>
        <MDXRemote source={source} />
        <FooterDisclaimer className="mt-12 not-prose" />
      </article>
    );
  } catch {
    notFound();
  }
}
