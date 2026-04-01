import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Terms" };

const TERMS_TABS = [
  {
    id: "overview",
    label: "Overview",
    content: [
      "By accessing this website or purchasing from us, you agree to be bound by these Terms of Service and all applicable laws.",
      "You are responsible for ensuring that your use of this site and any products complies with all laws and regulations in your jurisdiction.",
      "We may update these Terms at any time. Continued use of the website constitutes acceptance of any changes.",
    ],
  },
  {
    id: "eligibility",
    label: "Eligibility",
    content: [
      "You must be at least 18 years old and legally capable of entering into a binding agreement to use this website.",
      "Access to products is intended for individuals and organizations engaged in legitimate research activities.",
      "We reserve the right to approve, deny, or cancel any order at our discretion, including requesting verification of intended use.",
    ],
  },
  {
    id: "research-use-only",
    label: "Research Use Only",
    content: [
      "All products sold on this website are strictly intended for laboratory research purposes only.",
      "Products are not intended for:",
      "- human consumption",
      "- medical or therapeutic use",
      "- diagnostic use",
      "- veterinary use unless explicitly lawful",
      "No content on this website should be interpreted as medical advice or guidance.",
      "These statements have not been evaluated by the FDA. Products are not intended to diagnose, treat, cure, or prevent any disease.",
    ],
  },
  {
    id: "accounts",
    label: "Accounts",
    content: [
      "If you create an account, you are responsible for maintaining the security of your login credentials and all activity under your account.",
      "You agree to provide accurate and up-to-date information at all times.",
      "We are not responsible for unauthorized access resulting from your failure to protect your account.",
    ],
  },
  {
    id: "orders-payments",
    label: "Orders & Payments",
    content: [
      "By placing an order, you agree that all information provided is accurate and that you are authorized to use the selected payment method.",
      "We reserve the right to:",
      "- refuse or cancel any order",
      "- limit purchase quantities",
      "- correct pricing errors",
      "- deny transactions suspected of fraud or misuse",
      "All pricing and availability are subject to change without notice.",
    ],
  },
  {
    id: "shipping",
    label: "Shipping",
    content: [
      "We offer free shipping on all orders.",
      "Delivery times are estimates and not guaranteed.",
      "We are not responsible for delays caused by carriers or external factors.",
      "Once an order is processed, it cannot be modified or canceled.",
      "Responsibility for the order transfers upon confirmed delivery.",
    ],
  },
  {
    id: "returns-refunds",
    label: "Returns & Refunds",
    content: [
      "Refund requests must be submitted within 3 days of confirmed delivery.",
      "Items must be:",
      "- unused",
      "- unopened",
      "- in original condition",
      "Opened or altered items are not eligible for return.",
      "If an order arrives damaged or incorrect, you must contact support within 3 days and provide photo evidence.",
      "We reserve the right to deny any request that does not meet these conditions.",
    ],
  },
  {
    id: "prohibited-use",
    label: "Prohibited Use",
    content: [
      "You agree not to:",
      "- use the site for unlawful purposes",
      "- misrepresent your identity or affiliation",
      "- resell products without authorization",
      "- promote or engage in human or animal use of products",
      "- provide dosing instructions or medical claims",
      "Violation of these rules may result in account termination and order cancellation.",
    ],
  },
  {
    id: "termination",
    label: "Termination",
    content: [
      "We reserve the right to suspend or terminate access to the website, cancel orders, or restrict future purchases at any time.",
      "This may occur due to:",
      "- violation of these Terms",
      "- suspected misuse of products",
      "- fraudulent activity",
      "- failure to verify intended use",
      "Termination does not remove any obligations under these Terms.",
    ],
  },
  {
    id: "assumption-of-risk",
    label: "Assumption of Risk",
    content: [
      "You acknowledge that all products are purchased at your own risk.",
      "You accept full responsibility for:",
      "- storage",
      "- handling",
      "- usage",
      "- compliance with laws",
      "We are not responsible for any outcomes resulting from misuse, improper handling, or application of products.",
    ],
  },
  {
    id: "liability-disclaimers",
    label: "Liability & Disclaimers",
    content: [
      "All products and content are provided without guarantees or warranties.",
      "We disclaim liability for:",
      "- misuse of products",
      "- improper handling or storage",
      "- any unintended outcomes",
      "To the fullest extent permitted by law, we are not liable for any damages arising from use of this website or products.",
      "Total liability shall not exceed the amount paid for the product in question.",
    ],
  },
  {
    id: "indemnification",
    label: "Indemnification",
    content: [
      "You agree to defend and hold harmless the company from any claims, damages, or losses resulting from:",
      "- your use or misuse of products",
      "- any statements or claims you make about products",
      "- violation of these Terms",
      "- violation of any laws",
      "This obligation continues even after your use of the site ends.",
    ],
  },
  {
    id: "intellectual-property",
    label: "Intellectual Property",
    content: [
      "All content on this website, including branding, images, and text, is owned by the company and may not be used without permission.",
    ],
  },
  {
    id: "affiliate-program",
    label: "Affiliate Program",
    content: [
      "If you participate in any referral or affiliate program:",
      "- commission eligibility and payouts are determined at our discretion",
      "- payouts may be withheld for suspicious or non-compliant activity",
      "- all marketing must comply with these Terms",
      "- no claims regarding human use are allowed",
      "We may modify or terminate the program at any time.",
    ],
  },
  {
    id: "dispute-resolution",
    label: "Dispute Resolution",
    content: [
      "Any disputes arising from use of this website or products will be resolved through binding arbitration.",
      "You agree to resolve disputes individually and waive participation in class actions.",
      "You waive the right to a jury trial.",
    ],
  },
  {
    id: "governing-law",
    label: "Governing Law",
    content: [
      "These Terms are governed by the laws of your selected operating state.",
      "All disputes must be handled within the appropriate courts of that jurisdiction.",
    ],
  },
  {
    id: "general-terms",
    label: "General Terms",
    content: [
      "If any part of these Terms is found to be invalid, the remaining provisions will remain in effect.",
      "Failure to enforce any provision does not constitute a waiver.",
      "These Terms represent the full agreement between you and the company.",
    ],
  },
  {
    id: "policy-updates",
    label: "Policy Updates",
    content: [
      "We reserve the right to update or modify these Terms at any time.",
      "Changes take effect immediately upon posting.",
      "Continued use of the site indicates acceptance of updated Terms.",
    ],
  },
  {
    id: "contact",
    label: "Contact",
    content: ["For questions regarding these Terms, please use the contact form available on the website."],
  },
];

export default function TermsPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(169,212,236,0.2),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(207,231,245,0.22),_transparent_38%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <section className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Terms of Service</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-[var(--text-muted)] md:text-base">
            These terms govern your use of this website and all products offered. Please review carefully.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Last Updated: March 31, 2026</p>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_16px_48px_rgba(30,26,23,0.12)] md:p-6">
          <Tabs defaultValue={TERMS_TABS[0].id} className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-center gap-2 rounded-xl bg-[var(--surface-2)] p-2">
              {TERMS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg border border-transparent bg-transparent px-3 py-2 text-xs font-semibold text-[var(--text-muted)] data-[state=active]:border-accent/40 data-[state=active]:bg-accent-muted data-[state=active]:text-[var(--text)] md:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TERMS_TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5 md:p-6">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{tab.label}</h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
                  {tab.content.map((line, index) =>
                    line.startsWith("- ") ? (
                      <li key={`${tab.id}-${index}`} className="ml-5 list-disc">
                        {line.replace("- ", "")}
                      </li>
                    ) : (
                      <p key={`${tab.id}-${index}`}>{line}</p>
                    )
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <p className="mt-10 text-center text-xs text-[var(--text-muted)]">For laboratory research use only. Not for human consumption.</p>
      </div>
    </div>
  );
}
