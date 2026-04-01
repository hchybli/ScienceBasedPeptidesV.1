"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const FAQ_ITEMS = [
  {
    q: "What are your products intended for?",
    a: "All products sold on this site are intended strictly for laboratory research use only and are not for human consumption.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes. We offer free shipping on all orders with no minimum required.",
  },
  {
    q: "How long does it take to receive a response?",
    a: "We typically respond to all inquiries within the same day.",
  },
  {
    q: "Can I request a refund?",
    a: "Refund requests must be submitted within 3 days of confirmed delivery. Items must be unused, unopened, and in original condition.",
  },
  {
    q: "What if my order arrives damaged or incorrect?",
    a: "If your order arrives damaged or incorrect, contact us within 3 days of delivery and include clear photos so our team can review and resolve the issue.",
  },
  {
    q: "Are there any return restrictions?",
    a: "Yes. Opened, used, or tampered products are not eligible for return or refund.",
  },
  {
    q: "How do I start a return request?",
    a: "Submit a request using the contact form on this page and include your order number and details of the issue.",
  },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="relative bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(169,212,236,0.2),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(207,231,245,0.22),_transparent_38%)]" />

      <div className="relative mx-auto max-w-5xl scroll-smooth px-4 pb-0 pt-16 md:pt-24">
        <section className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Support</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[var(--text-muted)] md:text-base">
            Questions about your order, products, or policies? Find answers below or send us a message.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <a href="#contact" className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text)]">
              Contact
            </a>
            <a href="#faq" className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text)]">
              FAQ
            </a>
            <a href="#returns" className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text)]">
              Returns
            </a>
          </div>
        </section>

        <section id="contact" className="mt-14 scroll-mt-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_48px_rgba(30,26,23,0.12)] md:p-8">
          <h2 className="font-display text-2xl font-semibold">Contact Us</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Send us your details and we will get back to you quickly.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              const payload = {
                type: "contact" as const,
                name: String(fd.get("name") ?? ""),
                email: String(fd.get("email") ?? ""),
                orderNumber: String(fd.get("order_number") ?? ""),
                message: String(fd.get("message") ?? ""),
              };
              setSending(true);
              const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              setSending(false);
              if (res.ok) {
                setSent(true);
                form.reset();
              }
            }}
          >
            <div>
              <label className="text-sm text-[var(--text)]">Full Name</label>
              <input
                name="name"
                required
                className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-accent/70 focus:shadow-[0_0_0_1px_rgba(169,212,236,0.45),0_0_22px_rgba(169,212,236,0.24)]"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text)]">Email Address</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-accent/70 focus:shadow-[0_0_0_1px_rgba(169,212,236,0.45),0_0_22px_rgba(169,212,236,0.24)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text)]">Order Number (optional)</label>
              <input
                name="order_number"
                className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-accent/70 focus:shadow-[0_0_0_1px_rgba(169,212,236,0.45),0_0_22px_rgba(169,212,236,0.24)]"
                placeholder="e.g. ORD-12345"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text)]">Message</label>
              <textarea
                name="message"
                required
                className="mt-1 min-h-[140px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-accent/70 focus:shadow-[0_0_0_1px_rgba(169,212,236,0.45),0_0_22px_rgba(169,212,236,0.24)]"
                placeholder="How can we help?"
              />
            </div>
            <Button
              type="submit"
              disabled={sending}
              className="h-11 w-full rounded-xl shadow-[0_10px_30px_rgba(169,212,236,0.24)] transition hover:shadow-[0_14px_36px_rgba(169,212,236,0.32)] sm:w-[220px]"
            >
              {sending ? "Sending..." : sent ? "Message Sent" : "Send Message"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            <p>We typically respond within the same day.</p>
            <p className="mt-1">Support Hours: 24/7</p>
          </div>
        </section>

        <section id="faq" className="mt-14 scroll-mt-28">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const open = openFaq === index;
              return (
                <div key={item.q} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[0_10px_24px_rgba(30,26,23,0.1)]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => setOpenFaq(open ? null : index)}
                  >
                    <span className="text-base font-medium text-[var(--text)]">{item.q}</span>
                    <span className="text-xl leading-none text-[var(--text-muted)]">{open ? "−" : "+"}</span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${open ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="returns" className="mt-14 scroll-mt-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_16px_48px_rgba(30,26,23,0.12)] md:p-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Returns &amp; Refund Policy</h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-[var(--text-muted)]">
            <p>We offer free shipping on all orders.</p>
            <p>Refund requests must be submitted within 3 days of confirmed delivery.</p>
            <div>
              <p className="mb-2">To be eligible for a refund, items must be:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>unused</li>
                <li>unopened</li>
                <li>in original condition</li>
                <li>in original packaging, if applicable</li>
              </ul>
            </div>
            <p>Opened, used, or tampered products are not eligible for return or refund.</p>
            <p>
              If an order arrives damaged or incorrect, you must contact us within 3 days of delivery and provide clear photo evidence for
              review.
            </p>
            <p>Approved refunds will be issued to the original payment method once the request has been reviewed and accepted.</p>
            <p>We reserve the right to deny any refund request that does not meet the conditions outlined above.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
