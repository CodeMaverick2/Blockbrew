import { Transaction, AwakensCSVRow } from "@/types";
import { formatTimestamp } from "@/lib/utils";
import { CHAIN_MAP } from "@/config/chains";

/**
 * Awaken CSV Format Documentation:
 * https://awaken.tax
 *
 * The Awaken format is used for crypto tax reporting. Each row represents
 * a single transaction with the following fields:
 *
 * - Date: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
 * - Type: Transaction type (Buy, Sell, Transfer In, Transfer Out, Trade, etc.)
 * - Sent Currency: The currency sent (e.g., ETH, BTC)
 * - Sent Amount: Amount sent
 * - Sent Cost Basis: USD cost basis of sent amount
 * - Received Currency: The currency received
 * - Received Amount: Amount received
 * - Received Cost Basis: USD cost basis of received amount
 * - Fee Currency: Currency used for fees
 * - Fee Amount: Fee amount
 * - Fee Cost Basis: USD cost basis of fee
 * - Net Worth Amount: Net worth impact
 * - Net Worth Currency: Currency for net worth
 * - Description: Human-readable description
 * - TX Hash: Transaction hash
 * - TX Src: Source (chain name or exchange)
 * - TX Dest: Destination (chain name or exchange)
 */

function getAwakensType(
  tx: Transaction,
  userAddress: string
): string {
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
  const isIncoming = tx.to.toLowerCase() === userAddress.toLowerCase();

  switch (tx.type) {
    case "transfer":
      if (isOutgoing && isIncoming) return "Self Transfer";
      return isOutgoing ? "Transfer Out" : "Transfer In";
    case "swap":
      return "Trade";
    case "stake":
      return "Stake";
    case "unstake":
      return "Unstake";
    case "claim":
      return "Claim Reward";
    case "delegate":
      return "Delegate";
    case "undelegate":
      return "Undelegate";
    case "mint":
      return "Mint";
    case "burn":
      return "Burn";
    case "bridge":
      return "Bridge";
    case "deposit":
      return "Deposit";
    case "withdraw":
      return "Withdraw";
    case "approval":
      return "Approval";
    case "contract":
      return "Contract Interaction";
    default:
      return isOutgoing ? "Transfer Out" : "Transfer In";
  }
}

function formatISODate(timestamp: number | string): string {
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  // Handle both seconds and milliseconds
  const date = ts > 10000000000 ? new Date(ts) : new Date(ts * 1000);
  return date.toISOString();
}

export function transactionToAwakensRow(
  tx: Transaction,
  userAddress: string
): AwakensCSVRow {
  const chain = CHAIN_MAP[tx.chain];
  const chainName = chain?.name || tx.chain;
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase();
  const type = getAwakensType(tx, userAddress);
  const symbol = tx.tokenSymbol || chain?.symbol || "UNKNOWN";

  // Determine sent/received based on direction
  let sentCurrency = "";
  let sentAmount = "";
  let receivedCurrency = "";
  let receivedAmount = "";

  if (isOutgoing) {
    sentCurrency = symbol;
    sentAmount = tx.value;
  } else {
    receivedCurrency = symbol;
    receivedAmount = tx.value;
  }

  // For swaps/trades, we might have both
  if (tx.type === "swap") {
    // In a swap, you send one token and receive another
    // Without detailed swap data, we'll mark both sides
    sentCurrency = symbol;
    sentAmount = tx.value;
    receivedCurrency = ""; // Would need swap output data
    receivedAmount = "";
  }

  // Build description
  let description = `${type}`;
  if (tx.method) {
    description += ` via ${tx.method}`;
  }
  if (parseFloat(tx.value) > 0) {
    description += `: ${tx.value} ${symbol}`;
  }

  return {
    Date: formatISODate(tx.timestamp),
    Type: type,
    "Sent Currency": sentCurrency,
    "Sent Amount": sentAmount,
    "Sent Cost Basis": tx.valueUsd || "",
    "Received Currency": receivedCurrency,
    "Received Amount": receivedAmount,
    "Received Cost Basis": "",
    "Fee Currency": isOutgoing ? (chain?.symbol || symbol) : "",
    "Fee Amount": isOutgoing ? tx.fee : "",
    "Fee Cost Basis": tx.feeUsd || "",
    "Net Worth Amount": "",
    "Net Worth Currency": "USD",
    Description: description,
    "TX Hash": tx.hash,
    "TX Src": isOutgoing ? chainName : tx.from,
    "TX Dest": isOutgoing ? tx.to : chainName,
  };
}

export function generateAwakensCSV(
  transactions: Transaction[],
  userAddress: string
): string {
  const headers = [
    "Date",
    "Type",
    "Sent Currency",
    "Sent Amount",
    "Sent Cost Basis",
    "Received Currency",
    "Received Amount",
    "Received Cost Basis",
    "Fee Currency",
    "Fee Amount",
    "Fee Cost Basis",
    "Net Worth Amount",
    "Net Worth Currency",
    "Description",
    "TX Hash",
    "TX Src",
    "TX Dest",
  ];

  const rows = transactions.map((tx) =>
    transactionToAwakensRow(tx, userAddress)
  );

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof AwakensCSVRow] || "";
          // Escape quotes and wrap in quotes if contains comma or quote
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

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFilename(
  address: string,
  chain: string,
  startDate?: Date,
  endDate?: Date
): string {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const chainName = CHAIN_MAP[chain]?.name || chain;
  const now = new Date().toISOString().split("T")[0];

  let filename = `${chainName}_${shortAddress}_transactions`;

  if (startDate && endDate) {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    filename += `_${start}_to_${end}`;
  } else {
    filename += `_${now}`;
  }

  return `${filename}_awaken.csv`;
}
