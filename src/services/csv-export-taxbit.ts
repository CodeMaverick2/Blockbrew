import { Transaction, TaxBitCSVRow } from "@/types";
import { CHAIN_MAP } from "@/config/chains";
import { downloadCSV } from "./csv-export";

/**
 * TaxBit CSV Format Documentation:
 * https://help.taxbit.com/hc/en-us/articles/360052530094-Importing-Data-via-CSV
 *
 * TaxBit expects the following columns:
 * - Date and Time: ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
 * - Transaction Type: buy, sell, trade, transfer, income, etc.
 * - Sent Quantity: Amount sent
 * - Sent Currency: Currency symbol sent
 * - Sending Source: Source wallet/exchange
 * - Received Quantity: Amount received
 * - Received Currency: Currency symbol received
 * - Receiving Destination: Destination wallet/exchange
 * - Fee: Transaction fee amount
 * - Fee Currency: Fee currency symbol
 * - Exchange Transaction ID: Internal ID
 * - Blockchain Transaction Hash: On-chain hash
 */

function getTaxBitTransactionType(tx: Transaction, userAddress: string): string {
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
  const isIncoming = tx.to.toLowerCase() === userAddress.toLowerCase();

  switch (tx.type) {
    case "transfer":
      if (isOutgoing && isIncoming) return "transfer";
      return isOutgoing ? "transfer" : "transfer";
    case "swap":
      return "trade";
    case "stake":
      return "transfer";
    case "unstake":
      return "transfer";
    case "claim":
      return "income";
    case "mint":
      return "income";
    case "burn":
      return "sell";
    case "bridge":
      return "transfer";
    case "delegate":
      return "transfer";
    case "undelegate":
      return "transfer";
    case "deposit":
      return "transfer";
    case "withdraw":
      return "transfer";
    case "approval":
      return "expense"; // Gas only
    default:
      return isOutgoing ? "transfer" : "transfer";
  }
}

function formatTaxBitDate(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  const date = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);
  return date.toISOString();
}

export function transactionToTaxBitRow(
  tx: Transaction,
  userAddress: string
): TaxBitCSVRow {
  const chain = CHAIN_MAP[tx.chain];
  const chainName = chain?.name || tx.chain;
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
  const symbol = tx.tokenSymbol || chain?.symbol || "UNKNOWN";

  let sentQuantity = "";
  let sentCurrency = "";
  let sendingSource = "";
  let receivedQuantity = "";
  let receivedCurrency = "";
  let receivingDestination = "";

  if (isOutgoing) {
    sentQuantity = tx.value;
    sentCurrency = symbol;
    sendingSource = `${chainName} Wallet`;
    receivingDestination = tx.to
      ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
      : "";
  } else {
    receivedQuantity = tx.value;
    receivedCurrency = symbol;
    sendingSource = tx.from
      ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
      : "";
    receivingDestination = `${chainName} Wallet`;
  }

  // For trades/swaps, populate both sides
  if (tx.type === "swap") {
    sentQuantity = tx.value;
    sentCurrency = symbol;
    sendingSource = `${chainName} Wallet`;
    receivingDestination = `${chainName} Wallet`;
  }

  const txType = getTaxBitTransactionType(tx, userAddress);

  return {
    "Date and Time": formatTaxBitDate(tx.timestamp),
    "Transaction Type": txType,
    "Sent Quantity": sentQuantity,
    "Sent Currency": sentCurrency,
    "Sending Source": sendingSource,
    "Received Quantity": receivedQuantity,
    "Received Currency": receivedCurrency,
    "Receiving Destination": receivingDestination,
    Fee: isOutgoing ? tx.fee : "",
    "Fee Currency": isOutgoing ? (chain?.symbol || symbol) : "",
    "Exchange Transaction ID": tx.id,
    "Blockchain Transaction Hash": tx.hash,
  };
}

export function generateTaxBitCSV(
  transactions: Transaction[],
  userAddress: string
): string {
  const headers = [
    "Date and Time",
    "Transaction Type",
    "Sent Quantity",
    "Sent Currency",
    "Sending Source",
    "Received Quantity",
    "Received Currency",
    "Receiving Destination",
    "Fee",
    "Fee Currency",
    "Exchange Transaction ID",
    "Blockchain Transaction Hash",
  ];

  const rows = transactions.map((tx) => transactionToTaxBitRow(tx, userAddress));

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof TaxBitCSVRow] || "";
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

export function downloadTaxBitCSV(
  transactions: Transaction[],
  userAddress: string,
  chain: string
): void {
  const csv = generateTaxBitCSV(transactions, userAddress);
  const shortAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  const chainName = CHAIN_MAP[chain]?.name || chain;
  const date = new Date().toISOString().split("T")[0];
  const filename = `${chainName}_${shortAddress}_${date}_taxbit.csv`;
  downloadCSV(csv, filename);
}
