import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatAmount(
  amount: string | number,
  decimals: number = 6
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0";

  if (Math.abs(num) < 0.000001) {
    return num.toExponential(2);
  }

  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }

  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  }

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(
  amount: string | number,
  currency: string = "USD"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return d.toLocaleString("en-US", defaultOptions);
}

export function formatTimestamp(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  // Handle both seconds and milliseconds timestamps
  const date = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);
  return formatDate(date);
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for older browsers
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "absolute";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  return new Promise((resolve, reject) => {
    if (document.execCommand("copy")) {
      resolve();
    } else {
      reject(new Error("Failed to copy text"));
    }
    document.body.removeChild(textArea);
  });
}

export function isValidAddress(address: string, chain: string): boolean {
  if (!address || typeof address !== "string") return false;

  const trimmed = address.trim();

  switch (chain.toLowerCase()) {
    case "ethereum":
    case "polygon":
    case "bsc":
    case "avalanche":
    case "arbitrum":
    case "optimism":
    case "base":
    case "ronin":
      // EVM addresses: 0x followed by 40 hex characters
      return /^0x[a-fA-F0-9]{40}$/.test(trimmed);

    case "bitcoin":
      // Bitcoin addresses: various formats
      return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);

    case "solana":
      // Solana addresses: base58, 32-44 characters
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);

    case "cosmos":
    case "osmosis":
      // Cosmos-based addresses
      return /^(cosmos|osmo)[a-zA-Z0-9]{38,45}$/.test(trimmed);

    case "polkadot":
      // Polkadot addresses: SS58 format
      return /^[1-9A-HJ-NP-Za-km-z]{46,48}$/.test(trimmed);

    case "bittensor":
      // Bittensor uses SS58 format similar to Polkadot
      return /^[1-9A-HJ-NP-Za-km-z]{46,48}$/.test(trimmed);

    default:
      // Generic validation: at least 20 characters
      return trimmed.length >= 20;
  }
}

export function getExplorerUrl(
  chain: string,
  address: string,
  type: "address" | "tx" = "address"
): string {
  const explorers: Record<string, { address: string; tx: string }> = {
    ethereum: {
      address: `https://etherscan.io/address/${address}`,
      tx: `https://etherscan.io/tx/${address}`,
    },
    polygon: {
      address: `https://polygonscan.com/address/${address}`,
      tx: `https://polygonscan.com/tx/${address}`,
    },
    bsc: {
      address: `https://bscscan.com/address/${address}`,
      tx: `https://bscscan.com/tx/${address}`,
    },
    avalanche: {
      address: `https://snowtrace.io/address/${address}`,
      tx: `https://snowtrace.io/tx/${address}`,
    },
    arbitrum: {
      address: `https://arbiscan.io/address/${address}`,
      tx: `https://arbiscan.io/tx/${address}`,
    },
    optimism: {
      address: `https://optimistic.etherscan.io/address/${address}`,
      tx: `https://optimistic.etherscan.io/tx/${address}`,
    },
    base: {
      address: `https://basescan.org/address/${address}`,
      tx: `https://basescan.org/tx/${address}`,
    },
    solana: {
      address: `https://solscan.io/account/${address}`,
      tx: `https://solscan.io/tx/${address}`,
    },
    bitcoin: {
      address: `https://blockchair.com/bitcoin/address/${address}`,
      tx: `https://blockchair.com/bitcoin/transaction/${address}`,
    },
    cosmos: {
      address: `https://www.mintscan.io/cosmos/account/${address}`,
      tx: `https://www.mintscan.io/cosmos/txs/${address}`,
    },
    osmosis: {
      address: `https://www.mintscan.io/osmosis/account/${address}`,
      tx: `https://www.mintscan.io/osmosis/txs/${address}`,
    },
    polkadot: {
      address: `https://polkadot.subscan.io/account/${address}`,
      tx: `https://polkadot.subscan.io/extrinsic/${address}`,
    },
    bittensor: {
      address: `https://taostats.io/account/${address}`,
      tx: `https://taostats.io/extrinsic/${address}`,
    },
    ronin: {
      address: `https://app.roninchain.com/address/${address}`,
      tx: `https://app.roninchain.com/tx/${address}`,
    },
  };

  const explorer = explorers[chain.toLowerCase()];
  if (!explorer) {
    return `https://blockchair.com/search?q=${address}`;
  }

  return explorer[type];
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
