import QRCode from "qrcode";

export interface CryptoOption {
  currency: string;
  symbol: string;
  walletAddress: string;
  network: string;
  icon: string;
}

/** Production defaults; override with WALLET_* env vars on Vercel if needed. */
export const DEFAULT_WALLET_BTC = "bc1qyyfe64ms49cpztjsz4f0rj93f5rf28wcdjcntq";
/** Same Ethereum address for USDC (ERC-20) and USDT (ERC-20). */
export const DEFAULT_WALLET_ERC20 = "0xD00DE72680ebCe9549729F202E860f4ca75894eB";

function isValidWalletAddress(symbol: string, address: string): boolean {
  const value = address.trim();
  if (!value || value.length > 128) return false;
  switch (symbol) {
    case "BTC":
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(value);
    case "USDC":
    case "USDT":
      return /^0x[a-fA-F0-9]{40}$/.test(value);
    default:
      return false;
  }
}

function resolveWallet(symbol: string, envValue: string | undefined, fallback: string): string {
  const trimmed = (envValue ?? "").trim();
  if (trimmed && isValidWalletAddress(symbol, trimmed)) return trimmed;
  return fallback;
}

export function getCryptoOptions(): CryptoOption[] {
  return [
    {
      currency: "Bitcoin",
      symbol: "BTC",
      walletAddress: resolveWallet("BTC", process.env.WALLET_BTC, DEFAULT_WALLET_BTC),
      network: "Bitcoin",
      icon: "₿",
    },
    {
      currency: "USD Coin",
      symbol: "USDC",
      walletAddress: resolveWallet("USDC", process.env.WALLET_USDC, DEFAULT_WALLET_ERC20),
      network: "Ethereum (ERC-20)",
      icon: "$",
    },
    {
      currency: "Tether",
      symbol: "USDT",
      walletAddress: resolveWallet("USDT", process.env.WALLET_USDT, DEFAULT_WALLET_ERC20),
      network: "Ethereum (ERC-20)",
      icon: "₮",
    },
  ];
}

export async function getExchangeRate(symbol: string): Promise<number> {
  const ids: Record<string, string> = {
    BTC: "bitcoin",
    USDC: "usd-coin",
    USDT: "tether",
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
  if (!isValidWalletAddress(symbol, walletAddress)) return walletAddress;

  switch (symbol) {
    case "BTC":
      return `bitcoin:${walletAddress}`;
    case "USDC":
    case "USDT":
      return `ethereum:${walletAddress}`;
    default:
      return walletAddress;
  }
}

export async function generateQRCode(walletAddress: string, symbol: string): Promise<string> {
  const payload = buildPaymentUri(symbol, walletAddress);
  if (!payload || payload.length > 512) {
    throw new Error("Invalid QR payload");
  }
  return QRCode.toDataURL(payload, {
    width: 200,
    margin: 1,
    color: { dark: "#0a0d0f", light: "#ffffff" },
  });
}
