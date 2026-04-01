import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Privacy" };

const PRIVACY_TABS = [
  {
    id: "overview",
    label: "Overview",
    content: [
      "We are committed to protecting your personal information and your privacy.",
      "This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or make a purchase.",
      "By using this website, you agree to the practices described in this policy.",
    ],
  },
  {
    id: "information-we-collect",
    label: "Information We Collect",
    content: [
      "We collect information you provide directly to us, including:",
      "- Name",
      "- Email address",
      "- Phone number",
      "- Shipping and billing address",
      "- Order and purchase details",
      "- Account login information (if applicable)",
      "- Messages or support requests",
      "We may also collect information automatically, including:",
      "- IP address",
      "- Device type and operating system",
      "- Browser type",
      "- Pages visited and time spent on the site",
      "- Referring and exit pages",
      "- Cookie and tracking data",
    ],
  },
  {
    id: "how-we-use-information",
    label: "How We Use Information",
    content: [
      "We use your information to:",
      "- Process and fulfill orders",
      "- Communicate with you about orders or support requests",
      "- Improve website performance and user experience",
      "- Detect and prevent fraud or unauthorized activity",
      "- Send marketing communications (only if you opt in)",
      "- Comply with legal obligations",
    ],
  },
  {
    id: "sharing-of-information",
    label: "Sharing of Information",
    content: [
      "We do not sell your personal information.",
      "We may share your information with:",
      "- Payment processors to complete transactions",
      "- Shipping providers to deliver your orders",
      "- Service providers that help operate our website",
      "- Legal authorities when required by law",
      "- Third parties in connection with a business transfer such as a merger or sale",
      "All third parties are required to handle your data securely.",
    ],
  },
  {
    id: "data-security",
    label: "Data Security",
    content: [
      "We implement industry-standard measures to protect your information, including:",
      "- Encrypted data transmission (SSL/TLS)",
      "- Secure payment processing through trusted providers",
      "- Restricted access to sensitive data",
      "- Monitoring and security safeguards",
      "While we take reasonable precautions, no system is completely secure.",
    ],
  },
  {
    id: "cookies-tracking",
    label: "Cookies & Tracking",
    content: [
      "We use cookies and similar technologies to:",
      "- Maintain cart and session data",
      "- Remember user preferences",
      "- Analyze traffic and site usage",
      "- Improve performance and user experience",
      "You can control cookie settings through your browser. Disabling cookies may affect site functionality.",
    ],
  },
  {
    id: "your-rights",
    label: "Your Rights",
    content: [
      "You may have the right to:",
      "- Request access to your personal data",
      "- Request corrections to inaccurate information",
      "- Request deletion of your data",
      "- Opt out of marketing communications",
      "- Request a copy of your data",
      "To make a request, use the contact form on our website.",
    ],
  },
  {
    id: "california-privacy-rights",
    label: "California Privacy Rights",
    content: [
      "If you are a California resident, you may have additional rights under applicable privacy laws, including:",
      "- The right to know what personal information is collected",
      "- The right to request deletion of your data",
      "- The right to opt out of data sale",
      "We do not sell personal information.",
    ],
  },
  {
    id: "age-restrictions",
    label: "Age Restrictions",
    content: [
      "This website is not intended for individuals under the age of 18.",
      "We do not knowingly collect personal information from minors. If such data is identified, it will be removed.",
    ],
  },
  {
    id: "third-party-links",
    label: "Third-Party Links",
    content: [
      "Our website may include links to third-party websites.",
      "We are not responsible for the privacy practices or content of those external sites. We recommend reviewing their policies before providing information.",
    ],
  },
  {
    id: "data-retention",
    label: "Data Retention",
    content: [
      "We retain personal information only as long as necessary to:",
      "- Fulfill orders",
      "- Comply with legal obligations",
      "- Resolve disputes",
      "- Enforce our agreements",
      "When data is no longer required, it is securely deleted or anonymized.",
    ],
  },
  {
    id: "policy-updates",
    label: "Policy Updates",
    content: [
      "We may update this Privacy Policy at any time.",
      "Changes take effect immediately upon posting. Continued use of the site indicates acceptance of the updated policy.",
    ],
  },
  {
    id: "contact",
    label: "Contact",
    content: ["If you have questions about this Privacy Policy or your data, please contact us using the support form available on this website."],
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(169,212,236,0.2),_transparent_42%),radial-gradient(circle_at_80%_20%,_rgba(207,231,245,0.22),_transparent_38%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <section className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-6xl">Privacy Policy</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-[var(--text-muted)] md:text-base">
            Learn how we collect, use, and protect your information.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Last Updated: March 31, 2026</p>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_16px_48px_rgba(30,26,23,0.12)] md:p-6">
          <Tabs defaultValue={PRIVACY_TABS[0].id} className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-center gap-2 rounded-xl bg-[var(--surface-2)] p-2">
              {PRIVACY_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg border border-transparent bg-transparent px-3 py-2 text-xs font-semibold text-[var(--text-muted)] data-[state=active]:border-accent/40 data-[state=active]:bg-accent-muted data-[state=active]:text-[var(--text)] md:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {PRIVACY_TABS.map((tab) => (
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
      </div>
    </div>
  );
}
