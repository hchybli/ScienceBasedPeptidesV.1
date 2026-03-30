import Link from "next/link";
import { FooterDisclaimer } from "@/components/ui/disclaimer";
import { DEFAULT_SITE_DISPLAY_NAME } from "@/lib/site";

const cols = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/bundles", label: "Research sets" },
      { href: "/research", label: "Research" },
      { href: "/protocols", label: "Research overviews" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/refund-policy", label: "Refund policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">
            {process.env.NEXT_PUBLIC_SITE_NAME ?? DEFAULT_SITE_DISPLAY_NAME}
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Independent analytical documentation. US fulfillment. Plain outer packaging for laboratory shipments.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold text-[var(--text)]">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[var(--text-muted)] hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <FooterDisclaimer />
        </div>
      </div>
    </footer>
  );
}
