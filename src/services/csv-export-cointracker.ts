import { Transaction, CoinTrackerCSVRow } from "@/types";
import { CHAIN_MAP } from "@/config/chains";
import { downloadCSV } from "./csv-export";

/**
 * CoinTracker CSV Format Documentation:
 * https://support.cointracker.io/hc/en-us/articles/4413071299729-How-to-import-transactions-via-CSV
 *
 * CoinTracker expects the following columns:
 * - Date: MM/DD/YYYY HH:MM:SS format (local time)
 * - Received Quantity: Amount received
 * - Received Currency: Currency symbol received
 * - Sent Quantity: Amount sent
 * - Sent Currency: Currency symbol sent
 * - Fee Amount: Transaction fee
 * - Fee Currency: Fee currency symbol
 * - Tag: Transaction tag (e.g., gift, staked, etc.)
 */

function getCoinTrackerTag(tx: Transaction, userAddress: string): string {
  switch (tx.type) {
    case "stake":
      return "staked";
    case "unstake":
      return "unstaked";
    case "claim":
      return "airdrop";
    case "mint":
      return "airdrop";
    case "burn":
      return "lost";
    case "swap":
      return "trade";
    case "bridge":
      return "transfer";
    case "delegate":
      return "staked";
    case "undelegate":
      return "unstaked";
    case "deposit":
      return "staked";
    case "withdraw":
      return "unstaked";
    default:
      return "";
  }
}

function formatCoinTrackerDate(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  const date = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);

  // Format as MM/DD/YYYY HH:MM:SS
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

export function transactionToCoinTrackerRow(
  tx: Transaction,
  userAddress: string
): CoinTrackerCSVRow {
  const chain = CHAIN_MAP[tx.chain];
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
  const symbol = tx.tokenSymbol || chain?.symbol || "UNKNOWN";

  let receivedQuantity = "";
  let receivedCurrency = "";
  let sentQuantity = "";
  let sentCurrency = "";

  if (isOutgoing) {
    sentQuantity = tx.value;
    sentCurrency = symbol;
  } else {
    receivedQuantity = tx.value;
    receivedCurrency = symbol;
  }

  // For swaps, populate both sides if data available
  if (tx.type === "swap") {
    sentQuantity = tx.value;
    sentCurrency = symbol;
  }

  const tag = getCoinTrackerTag(tx, userAddress);

  return {
    Date: formatCoinTrackerDate(tx.timestamp),
    "Received Quantity": receivedQuantity,
    "Received Currency": receivedCurrency,
    "Sent Quantity": sentQuantity,
    "Sent Currency": sentCurrency,
    "Fee Amount": isOutgoing ? tx.fee : "",
    "Fee Currency": isOutgoing ? (chain?.symbol || symbol) : "",
    Tag: tag,
  };
}

export function generateCoinTrackerCSV(
  transactions: Transaction[],
  userAddress: string
): string {
  const headers = [
    "Date",
    "Received Quantity",
    "Received Currency",
    "Sent Quantity",
    "Sent Currency",
    "Fee Amount",
    "Fee Currency",
    "Tag",
  ];

  const rows = transactions.map((tx) =>
    transactionToCoinTrackerRow(tx, userAddress)
  );

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof CoinTrackerCSVRow] || "";
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ];

  return csvRows.join("\n");
}

export function downloadCoinTrackerCSV(
  transactions: Transaction[],
  userAddress: string,
  chain: string
): void {
  const csv = generateCoinTrackerCSV(transactions, userAddress);
  const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  const chainName = CHAIN_MAP[chain]?.name || chain;
  const date = new Date().toISOString().split("T")[0];
  const filename = `${chainName}_${shortAddress}_${date}_cointracker.csv`;
  downloadCSV(csv, filename);
}
