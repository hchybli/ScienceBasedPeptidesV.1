import QRCode from "qrcode";

export interface CryptoOption {
  currency: string;
  symbol: string;
  walletAddress: string;
  network: string;
  icon: string;
}

function isConfigured(address: string): boolean {
  return !address.includes("CONFIGURE_");
}

function isValidWalletAddress(symbol: string, address: string): boolean {
  const value = address.trim();
  if (!value || value.length > 128) return false;
  // Basic chain-level validation to prevent malformed/unsafe QR payloads.
  switch (symbol) {
    case "BTC":
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(value);
    case "ETH":
    case "USDC":
      return /^0x[a-fA-F0-9]{40}$/.test(value);
    case "USDT":
      return /^T[1-9A-HJ-NP-Za-km-z]{25,40}$/.test(value) || /^0x[a-fA-F0-9]{40}$/.test(value);
    case "XRP":
      return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value);
    default:
      return false;
  }
}

function safeWalletAddress(symbol: string, rawAddress: string, fallback: string): string {
  if (!isConfigured(rawAddress)) return fallback;
  return isValidWalletAddress(symbol, rawAddress) ? rawAddress.trim() : fallback;
}

export function getCryptoOptions(): CryptoOption[] {
  return [
    {
      currency: "Bitcoin",
      symbol: "BTC",
      walletAddress: safeWalletAddress("BTC", process.env.WALLET_BTC || "", "CONFIGURE_BTC_WALLET_IN_ENV"),
      network: "Bitcoin",
      icon: "₿",
    },
    {
      currency: "Ethereum",
      symbol: "ETH",
      walletAddress: safeWalletAddress("ETH", process.env.WALLET_ETH || "", "CONFIGURE_ETH_WALLET_IN_ENV"),
      network: "Ethereum",
      icon: "Ξ",
    },
    {
      currency: "USD Coin",
      symbol: "USDC",
      walletAddress: safeWalletAddress("USDC", process.env.WALLET_USDC || "", "CONFIGURE_USDC_WALLET_IN_ENV"),
      network: "ERC-20",
      icon: "$",
    },
    {
      currency: "Tether",
      symbol: "USDT",
      walletAddress: safeWalletAddress("USDT", process.env.WALLET_USDT || "", "CONFIGURE_USDT_WALLET_IN_ENV"),
      network: "TRC-20",
      icon: "$",
    },
    {
      currency: "XRP",
      symbol: "XRP",
      walletAddress: safeWalletAddress("XRP", process.env.WALLET_XRP || "", "CONFIGURE_XRP_WALLET_IN_ENV"),
      network: "XRP Ledger",
      icon: "✕",
    },
  ];
}

export async function getExchangeRate(symbol: string): Promise<number> {
  const ids: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDC: "usd-coin",
    USDT: "tether",
    XRP: "ripple",
  };
  const id = ids[symbol];
  if (!id) return 1;
  if (symbol === "USDC" || symbol === "USDT") return 1;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`, {
      next: { revalidate: 60 },
    });
    const data = (await res.json()) as Record<string, { usd?: number }>;
    return data[id]?.usd ?? 1;
  } catch {
    return 1;
  }
}

export async function calculateCryptoAmount(usdAmount: number, symbol: string): Promise<number> {
  const rate = await getExchangeRate(symbol);
  return Number((usdAmount / rate).toFixed(8));
}

function buildPaymentUri(symbol: string, walletAddress: string): string {
  if (walletAddress.includes("CONFIGURE_")) return walletAddress;
  if (!isValidWalletAddress(symbol, walletAddress)) return walletAddress;

  switch (symbol) {
    case "BTC":
      return `bitcoin:${walletAddress}`;
    case "ETH":
    case "USDC":
      return `ethereum:${walletAddress}`;
    case "USDT":
      return walletAddress.startsWith("T") ? `tron:${walletAddress}` : `ethereum:${walletAddress}`;
    case "XRP":
      return `xrpl:${walletAddress}`;
    default:
      return walletAddress;
  }
}

export async function generateQRCode(walletAddress: string, symbol: string): Promise<string> {
  const payload = buildPaymentUri(symbol, walletAddress);
  if (!payload || payload.length > 256) {
    throw new Error("Invalid QR payload");
  }
  return QRCode.toDataURL(payload, {
    width: 200,
    margin: 1,
    color: { dark: "#0a0d0f", light: "#ffffff" },
  });
}
