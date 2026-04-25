import Link from "next/link";
import {
  BadgeCheck,
  FlaskConical,
  Headset,
  PackageCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { FeaturedProductsShowcase } from "@/components/home/featured-products-showcase";
import { VialSideDecorations } from "@/components/home/vial-side-decorations";
import { listPublicProductFilenames, mergeProductImagesWithDisk } from "@/lib/product-images-server";
import { FEATURED_CAROUSEL_SLUGS, FEATURED_SELECTION_IMAGE_BY_SLUG } from "@/lib/featured-selection-images";
import { getCanonicalProductImage, getProductHeroBackgroundCss } from "@/lib/product-pdp-theme";
import { resolveFeaturedShowcaseImageUrl } from "@/lib/showcase-image";
import { parseJsonArray } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Omitted from homepage featured vial carousel (shop unchanged). */
const EXCLUDED_FROM_FEATURED_SHOWCASE = new Set([
  "cjc-1295-no-dac",
  "semaglutide",
]);

export default async function HomePage() {
  const allProducts = (await prisma.$queryRawUnsafe(`
      SELECT p.*, v.id as vid, v.price, v.size, v.compare_at, c.slug as category_slug FROM products p
      JOIN variants v ON v.product_id = p.id AND v.is_default = 1
      JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1 ORDER BY p.sold_count DESC, p.name ASC
    `)) as Array<Record<string, unknown>>;

  const productFiles = listPublicProductFilenames();

  const featuredCarouselItemsRaw = allProducts
    .map((p) => {
      const imgs = mergeProductImagesWithDisk(p.slug as string, parseJsonArray<string>(p.images as string, []), productFiles);
      const primaryImage = getCanonicalProductImage(p.slug as string, imgs);
      if (primaryImage === "/placeholder-peptide.svg") return null;
      const slug = p.slug as string;
      const featuredArt = FEATURED_SELECTION_IMAGE_BY_SLUG[slug];
      const image = featuredArt ?? resolveFeaturedShowcaseImageUrl(primaryImage);
      return {
        id: p.id as string,
        slug,
        name: p.name as string,
        purity: (p.purity as number | null) ?? null,
        image,
        shopImage: primaryImage,
        price: p.price as number,
        compareAt: (p.compare_at as number | null) ?? null,
        variantId: p.vid as string,
        size: p.size as string,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    slug: string;
    name: string;
    purity: number | null;
    image: string;
    shopImage: string;
    price: number;
    compareAt: number | null;
    variantId: string;
    size: string;
  }>;

  const featuredBySlug = new Map(featuredCarouselItemsRaw.map((item) => [item.slug, item]));
  const featuredCarouselItems = FEATURED_CAROUSEL_SLUGS.map((slug) => featuredBySlug.get(slug))
    .filter(
      (item): item is NonNullable<typeof item> =>
        item != null && !EXCLUDED_FROM_FEATURED_SHOWCASE.has(item.slug),
    );

  const featuredIds = featuredCarouselItems.map((i) => i.id);
  const featuredVariantsRows =
    featuredIds.length === 0
      ? []
      : await prisma.variants.findMany({
          where: { product_id: { in: featuredIds } },
          orderBy: { display_order: "asc" },
        });

  const variantsByProductId = new Map<string, typeof featuredVariantsRows>();
  for (const v of featuredVariantsRows) {
    const list = variantsByProductId.get(v.product_id) ?? [];
    list.push(v);
    variantsByProductId.set(v.product_id, list);
  }

  const featuredCarouselItemsWithVariants = featuredCarouselItems.map((item) => {
    const rows = variantsByProductId.get(item.id) ?? [];
    const variants =
      rows.length > 0
        ? rows.map((v) => ({
            id: v.id,
            size: v.size,
            price: v.price,
            compareAt: v.compare_at,
            isDefault: v.is_default === 1,
          }))
        : [
            {
              id: item.variantId,
              size: item.size,
              price: item.price,
              compareAt: item.compareAt,
              isDefault: true,
            },
          ];
    return { ...item, variants };
  });
  const catalogVialDecorUrls =
    featuredCarouselItems.length > 0 ? featuredCarouselItems.map((item) => item.image) : [];

  const homepageResearchCards = allProducts
    .filter((p) => {
      const imgs = mergeProductImagesWithDisk(p.slug as string, parseJsonArray<string>(p.images as string, []), productFiles);
      const primaryImage = getCanonicalProductImage(p.slug as string, imgs);
      if (primaryImage === "/placeholder-peptide.svg") return false;

      const name = String(p.name ?? "").toLowerCase();
      const slug = String(p.slug ?? "").toLowerCase();
      if (name.includes("alcohol prep pads") || slug.includes("alcohol-prep-pads")) return false;

      return true;
    })
    .slice(0, 2);
  const normalize = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const curatedBestSellers = [
    allProducts.find((p) => {
      const slug = normalize(p.slug);
      const name = normalize(p.name);
      return slug === "ghkcu" || slug === "ghk-cu" || name === "ghkcu";
    }),
    allProducts.find((p) => normalize(p.name) === "bpc157" || normalize(p.slug).includes("bpc157")),
    allProducts.find((p) => {
      const slug = normalize(p.slug);
      const name = normalize(p.name);
      return name === "melanotanii" || slug.includes("melanotanii") || slug.includes("melanotan2");
    }),
    allProducts.find((p) => normalize(p.name) === "retatrutide" || normalize(p.slug).includes("retatrutide")),
  ].filter(Boolean) as Array<Record<string, unknown>>;

  const sectionWrap = "mx-auto max-w-7xl px-4 py-14 md:py-16";
  const sectionTitle = "font-display text-3xl font-semibold tracking-tight md:text-4xl";

  return (
    <div className="bg-[var(--bg)]">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(120,189,223,0.18),transparent_40%),radial-gradient(circle_at_80%_22%,rgba(152,205,232,0.22),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:py-16 lg:grid-cols-[1.05fr_1.25fr] lg:items-center">
          <div>
            <h1 className="font-display max-w-4xl text-4xl font-semibold tracking-tight text-[var(--text)] md:text-6xl">
              <span className="whitespace-nowrap">Premium Research</span> Compounds. Built for Serious Standards.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
              High-quality research products, clean presentation, and a premium buying experience designed for
              consistency, clarity,
              <br />
              and confidence.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/shop">Shop Products</Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              {[
                "Research-use-only catalog",
                "Free shipping on all orders",
                "Premium product presentation",
                "Fast, clean shopping experience",
              ].map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[linear-gradient(145deg,#fffdf9,#f3efe7)] px-4 py-2.5 text-[13px] font-medium text-[var(--text)] shadow-[0_8px_20px_rgba(30,26,23,0.08)]"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-accent/35 bg-accent/10">
                    <BadgeCheck className="h-3 w-3 text-accent" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[400px] items-center justify-center sm:min-h-[500px] lg:justify-end">
            <div className="relative mx-auto w-full max-w-[1180px] translate-y-8 sm:max-w-[1320px] sm:translate-y-12 lg:mx-0 lg:translate-x-3 lg:translate-y-7">
              {/* Plain img: transparent hero PNG; Next/Image can show a dark frame on alpha assets. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-home-stack.png?v=hero-png-knockout-1"
                alt="Premium research peptide vials — GLP, BPC-157, GHK-Cu, TB-500"
                width={1024}
                height={682}
                className="h-auto w-full max-md:-translate-x-1 md:-translate-x-6 scale-[1.08] object-contain object-center [background:none] drop-shadow-[0_24px_50px_rgba(0,0,0,0.35)] sm:scale-[1.14]"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={sectionWrap}>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Featured</p>
        <h2 className={`${sectionTitle} mt-2`}>Featured Products</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-muted)]">
          Explore some of the most sought-after products in the catalog.
        </p>
        {featuredCarouselItems.length > 0 ? (
          <div className="mt-10">
            <FeaturedProductsShowcase items={featuredCarouselItemsWithVariants} />
          </div>
        ) : (
          <p className="mt-7 text-sm text-[var(--text-muted)]">
            <Link href="/shop" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
              Browse the shop
            </Link>{" "}
            for the full catalog.
          </p>
        )}
      </section>

      <section className={sectionWrap}>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Trust</p>
        <h2 className={`${sectionTitle} mt-2`}>Why Choose HALVECO</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Clean Product Presentation",
              text: "A premium storefront experience with clear navigation, readable product pages, and consistent structure across the catalog.",
              icon: Sparkles,
            },
            {
              title: "Competitive Pricing",
              text: "Our pricing model is built to stay highly competitive across research compound catalogs while maintaining premium presentation and consistency.",
              icon: PackageCheck,
            },
            {
              title: "Free Shipping",
              text: "Every order ships free, making checkout simpler and more transparent.",
              icon: Truck,
            },
            {
              title: "Support That Responds",
              text: "Our team aims to respond within the same day through the site support flow.",
              icon: Headset,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-surface p-5 shadow-[0_12px_24px_rgba(0,0,0,0.25)] transition hover:border-accent/35"
            >
              <item.icon className="h-5 w-5 text-accent" />
              <p className="mt-4 font-display text-xl font-semibold tracking-tight">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={sectionWrap}>
        <div className="grid gap-8 rounded-3xl border border-[var(--border)] bg-surface p-6 shadow-[0_16px_32px_rgba(0,0,0,0.28)] md:grid-cols-[1fr_1.45fr] md:p-8">
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Build Your Stack</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Blend Smarter, Stack Cleaner
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
              Explore blend formulas and core peptides in one flow to build a cleaner stack setup. Compare options,
              pair compatible compounds, and move from browsing to checkout faster.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/shop">Shop</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/shop">Build a Stack</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              For laboratory research use only. Not for human consumption.
            </p>
          </div>
          <div className="relative isolate rounded-2xl border border-[var(--border)] bg-transparent p-2 sm:p-3">
            {/* Local PNG with alpha — plain img avoids Next/Image black-frame on transparent PNGs (see ProductCard). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/stack-builder-vials.png?v=stack-png-knockout-1"
              alt="Build your research stack visual"
              className="h-auto w-full object-contain object-center [background:none]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className={sectionWrap}>
        <div className="grid gap-10 rounded-3xl border border-[var(--border)] bg-[#F5F2E9] p-10 shadow-[0_12px_40px_rgba(30,26,23,0.08)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:items-start md:gap-12 lg:gap-14">
          <div className="grid min-w-0 grid-cols-2 gap-4 sm:gap-5">
            {homepageResearchCards.map((p, idx) => {
              const img = getCanonicalProductImage(
                p.slug as string,
                mergeProductImagesWithDisk(p.slug as string, parseJsonArray<string>(p.images as string, []), productFiles),
              );
              return (
                <ProductCard
                  key={`research-card-${p.id as string}`}
                  id={p.id as string}
                  slug={p.slug as string}
                  name={`${p.name as string} Research`}
                  purity={(p.purity as number | null) ?? null}
                  image={img}
                  price={p.price as number}
                  compareAt={(p.compare_at as number | null) ?? null}
                  variantId={p.vid as string}
                  size={p.size as string}
                  context="research"
                  priority={idx < 2}
                  heroBackgroundCss={getProductHeroBackgroundCss(p.slug as string)}
                />
              );
            })}
          </div>
          <div className="relative grid min-h-0 gap-6 md:min-h-[min(24rem,100%)] md:grid-cols-[minmax(0,1fr)_min(9.5rem)] md:items-stretch lg:grid-cols-[minmax(0,1fr)_min(11rem)]">
            <div className="relative z-10 min-w-0">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] md:text-4xl">
                A More Refined Research Buying Experience
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] md:text-[15px] md:leading-[1.65]">
                This storefront is built to provide a cleaner, more consistent experience across the full catalog - from
                browsing and product selection to support and policy clarity. Every section is designed to feel
                intentional, organized, and easy to navigate.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[var(--text-muted)]">
                {[
                  "Clear product structure",
                  "Consistent variant organization",
                  "Unified support and policy pages",
                  "Built for a smoother customer experience",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/25 text-[var(--accent)]">
                      <BadgeCheck className="h-3 w-3" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="relative -mx-1 hidden min-h-[14rem] overflow-hidden sm:-mx-0 md:block"
              aria-hidden
            >
              <VialSideDecorations imageUrls={catalogVialDecorUrls} sides="right" fillContainer />
            </div>
          </div>
        </div>
      </section>

      <section className={sectionWrap}>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Quick Shop</p>
        <h2 className={`${sectionTitle} mt-2`}>Bestsellers</h2>
        <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {curatedBestSellers.map((p) => {
            const imgs = mergeProductImagesWithDisk(p.slug as string, parseJsonArray<string>(p.images as string, []), productFiles);
            const primaryImage = getCanonicalProductImage(p.slug as string, imgs);
            if (primaryImage === "/placeholder-peptide.svg") return null;
            return (
              <ProductCard
                key={`homepage-bestseller-${p.id as string}`}
                id={p.id as string}
                slug={p.slug as string}
                name={p.name as string}
                purity={(p.purity as number | null) ?? null}
                image={primaryImage}
                price={p.price as number}
                compareAt={(p.compare_at as number | null) ?? null}
                variantId={p.vid as string}
                size={p.size as string}
                heroBackgroundCss={getProductHeroBackgroundCss(p.slug as string)}
              />
            );
          })}
        </div>
      </section>

      <section className={sectionWrap}>
        <p className="text-center text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">FAQ</p>
        <h2 className={`${sectionTitle} mt-2 text-center`}>Frequently Asked Questions</h2>
        <div className="mx-auto mt-7 max-w-4xl space-y-3">
          {[
            {
              q: "What are your products intended for?",
              a: "All products offered on this site are intended strictly for laboratory research use only and are not for human consumption.",
            },
            { q: "Do you offer free shipping?", a: "Yes. Free shipping is available on all orders." },
            { q: "How quickly can I get a response from support?", a: "We typically respond to support inquiries within the same day." },
            {
              q: "Can I request a refund?",
              a: "Refund requests must be submitted within 3 days of confirmed delivery and must meet the conditions outlined in our policy pages.",
            },
            {
              q: "Where can I find full policy information?",
              a: "You can review our Terms, Privacy Policy, and Support page for more information.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group overflow-hidden rounded-xl border border-[var(--border)] bg-surface p-5 transition open:border-accent/35"
            >
              <summary className="cursor-pointer list-none font-medium">
                <span>{item.q}</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          For laboratory research use only. Not for human consumption.
        </p>
      </section>

      <section className={sectionWrap}>
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(150deg,rgba(255,253,249,0.98),rgba(243,239,231,0.96))] px-6 py-12 text-center shadow-[0_18px_34px_rgba(0,0,0,0.3)] md:px-10">
          <VialSideDecorations imageUrls={catalogVialDecorUrls} />
          <div className="relative z-10">
            <h2 className="font-display text-4xl font-semibold tracking-tight">Explore the Full Catalog</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-muted)] md:text-base">
              Browse the latest products, blends, and essentials in one streamlined shopping experience.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/shop">Shop All Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
