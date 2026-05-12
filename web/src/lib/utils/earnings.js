/**
 * Earnings and Region Configuration Utilities
 */

export const REGION_CONFIG = {
  "US": { rate: 0.004, currency: "USD", symbol: "$", exchange: 1 },
  "GB": { rate: 0.0035, currency: "GBP", symbol: "£", exchange: 0.79 },
  "DE": { rate: 0.0035, currency: "EUR", symbol: "€", exchange: 0.92 },
  "FR": { rate: 0.003, currency: "EUR", symbol: "€", exchange: 0.92 },
  "JP": { rate: 0.004, currency: "JPY", symbol: "¥", exchange: 150 },
  "CA": { rate: 0.003, currency: "CAD", symbol: "CA$", exchange: 1.35 },
  "AU": { rate: 0.003, currency: "AUD", symbol: "A$", exchange: 1.52 },
  "IN": { rate: 0.0008, currency: "INR", symbol: "₹", exchange: 83 },
  "BR": { rate: 0.0012, currency: "BRL", symbol: "R$", exchange: 4.95 },
  "MX": { rate: 0.0015, currency: "MXN", symbol: "Mex$", exchange: 17 },
  "KR": { rate: 0.0035, currency: "KRW", symbol: "₩", exchange: 1330 },
  "SA": { rate: 0.0025, currency: "SAR", symbol: "SR", exchange: 3.75 },
  "ID": { rate: 0.0007, currency: "IDR", symbol: "Rp", exchange: 15600 },
  "NG": { rate: 0.0005, currency: "NGN", symbol: "₦", exchange: 1500 }
};

export const getEarnings = (views, region = "US") => {
  const config = REGION_CONFIG[region] || REGION_CONFIG["US"];
  const usdValue = parseInt(views || 0) * config.rate;
  const localValue = usdValue * config.exchange;
  return { usd: usdValue, local: localValue, ...config };
};
