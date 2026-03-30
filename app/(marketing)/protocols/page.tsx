import Link from "next/link";
import { getMdxSlugs } from "@/lib/mdx";
import { FooterDisclaimer } from "@/components/ui/disclaimer";

const titles: Record<string, string> = {
  "bpc-157-research-overview": "BPC-157 — laboratory research overview",
  "multi-compound-set-bpc-tb": "Multi-compound research set (BPC-157 / TB-500)",
  "cjc-ipamorelin-secretagogue-overview": "CJC-1295 / Ipamorelin — laboratory research overview",
  "ghk-cu-matrix-research-overview": "GHK-Cu — matrix research overview",
  "multi-compound-set-nad-ghk-epitalon": "Multi-compound research set (NAD+ / GHK-Cu / Epitalon)",
};

export default function ProtocolsPage() {
  const slugs = getMdxSlugs("protocols");
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-semibold">Research overviews</h1>
      <p className="mt-4 text-[var(--text-muted)]">
        Literature-aligned summaries for laboratory procurement planning. No administration, preparation, or use guidance
        outside qualified research contexts.
      </p>
      <ul className="mt-10 space-y-4">
        {slugs.map((s) => (
          <li key={s}>
            <Link href={`/protocols/${s}`} className="text-lg text-accent hover:underline">
              {titles[s] ?? s}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-16 max-w-3xl">
        <FooterDisclaimer />
      </div>
    </div>
  );
}
