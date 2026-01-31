import { Transaction, KoinlyCSVRow } from "@/types";
import { CHAIN_MAP } from "@/config/chains";
import { downloadCSV } from "./csv-export";

/**
 * Koinly CSV Format Documentation:
 * https://help.koinly.io/en/articles/3662999-how-to-create-a-custom-csv-file-with-your-data
 *
 * Koinly expects the following columns:
 * - Date: UTC timestamp (YYYY-MM-DD HH:mm:ss UTC)
 * - Sent Amount: Amount of crypto sent
 * - Sent Currency: Currency symbol sent
 * - Received Amount: Amount of crypto received
 * - Received Currency: Currency symbol received
 * - Fee Amount: Transaction fee
 * - Fee Currency: Currency of the fee
 * - Net Worth Amount: Optional net worth
 * - Net Worth Currency: Currency for net worth
 * - Label: Transaction label (e.g., gift, donation, lost, etc.)
 * - Description: Optional description
 * - TxHash: Transaction hash
 */

function getKoinlyLabel(tx: Transaction, userAddress: string): string {
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();

  switch (tx.type) {
    case "stake":
      return "staked";
    case "unstake":
      return "unstaked";
    case "claim":
      return "reward";
    case "mint":
      return "airdrop";
    case "burn":
      return "lost";
    case "bridge":
      return "transfer";
    case "approval":
      return "";
    case "swap":
      return "swap";
    default:
      return "";
  }
}

function formatKoinlyDate(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  const date = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);

  // Format as YYYY-MM-DD HH:mm:ss UTC
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

export function transactionToKoinlyRow(
  tx: Transaction,
  userAddress: string
): KoinlyCSVRow {
  const chain = CHAIN_MAP[tx.chain];
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
  const symbol = tx.tokenSymbol || chain?.symbol || "UNKNOWN";

  let sentAmount = "";
  let sentCurrency = "";
  let receivedAmount = "";
  let receivedCurrency = "";

  if (isOutgoing) {
    sentAmount = tx.value;
    sentCurrency = symbol;
  } else {
    receivedAmount = tx.value;
    receivedCurrency = symbol;
  }

  // For swaps, if we have output data we'd populate both sides
  if (tx.type === "swap") {
    sentAmount = tx.value;
    sentCurrency = symbol;
    // Note: Without detailed swap output data, received side may be empty
  }

  const label = getKoinlyLabel(tx, userAddress);

  let description = tx.type;
  if (tx.method) {
    description += ` via ${tx.method}`;
  }

  return {
    Date: formatKoinlyDate(tx.timestamp),
    "Sent Amount": sentAmount,
    "Sent Currency": sentCurrency,
    "Received Amount": receivedAmount,
    "Received Currency": receivedCurrency,
    "Fee Amount": isOutgoing ? tx.fee : "",
    "Fee Currency": isOutgoing ? (chain?.symbol || symbol) : "",
    "Net Worth Amount": "",
    "Net Worth Currency": "USD",
    Label: label,
    Description: description,
    TxHash: tx.hash,
  };
}

export function generateKoinlyCSV(
  transactions: Transaction[],
  userAddress: string
): string {
  const headers = [
    "Date",
    "Sent Amount",
    "Sent Currency",
    "Received Amount",
    "Received Currency",
    "Fee Amount",
    "Fee Currency",
    "Net Worth Amount",
    "Net Worth Currency",
    "Label",
    "Description",
    "TxHash",
  ];

  const rows = transactions.map((tx) => transactionToKoinlyRow(tx, userAddress));

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof KoinlyCSVRow] || "";
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

export function downloadKoinlyCSV(
  transactions: Transaction[],
  userAddress: string,
  chain: string
): void {
  const csv = generateKoinlyCSV(transactions, userAddress);
  const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  const chainName = CHAIN_MAP[chain]?.name || chain;
  const date = new Date().toISOString().split("T")[0];
  const filename = `${chainName}_${shortAddress}_${date}_koinly.csv`;
  downloadCSV(csv, filename);
}
