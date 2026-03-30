import { getCryptoOptions, generateQRCode } from "@/lib/crypto-payment";
import { CheckoutClient } from "@/components/shop/checkout-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const options = getCryptoOptions();
  const qrMap: Record<string, string> = {};
  for (const o of options) {
    qrMap[o.symbol] = await generateQRCode(o.walletAddress);
  }
  return <CheckoutClient options={options} qrMap={qrMap} />;
}
