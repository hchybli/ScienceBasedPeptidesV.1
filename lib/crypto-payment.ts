import QRCode from "qrcode";

export interface CryptoOption {
  currency: string;
  symbol: string;
  walletAddress: string;
  network: string;
  icon: string;
}

export function getCryptoOptions(): CryptoOption[] {
  const options: CryptoOption[] = [];
  if (process.env.WALLET_BTC)
    options.push({
      currency: "Bitcoin",
      symbol: "BTC",
      walletAddress: process.env.WALLET_BTC,
      network: "Bitcoin",
      icon: "₿",
    });
  if (process.env.WALLET_ETH)
    options.push({
      currency: "Ethereum",
      symbol: "ETH",
      walletAddress: process.env.WALLET_ETH,
      network: "ERC-20",
      icon: "Ξ",
    });
  if (process.env.WALLET_USDC)
    options.push({
      currency: "USD Coin",
      symbol: "USDC",
      walletAddress: process.env.WALLET_USDC,
      network: "ERC-20",
      icon: "$",
    });
  if (process.env.WALLET_LTC)
    options.push({
      currency: "Litecoin",
      symbol: "LTC",
      walletAddress: process.env.WALLET_LTC,
      network: "Litecoin",
      icon: "Ł",
    });
  if (process.env.WALLET_XMR)
    options.push({
      currency: "Monero",
      symbol: "XMR",
      walletAddress: process.env.WALLET_XMR,
      network: "Monero",
      icon: "ɱ",
    });
  if (options.length === 0)
    options.push({
      currency: "Bitcoin",
      symbol: "BTC",
      walletAddress: "CONFIGURE_WALLET_IN_ENV",
      network: "Bitcoin",
      icon: "₿",
    });
  return options;
}

export async function getExchangeRate(symbol: string): Promise<number> {
  const ids: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDC: "usd-coin",
    LTC: "litecoin",
    XMR: "monero",
  };
  const id = ids[symbol];
  if (!id) return 1;
  if (symbol === "USDC") return 1;
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

export async function generateQRCode(walletAddress: string): Promise<string> {
  return QRCode.toDataURL(walletAddress, {
    width: 200,
    margin: 1,
    color: { dark: "#0a0d0f", light: "#ffffff" },
  });
}
