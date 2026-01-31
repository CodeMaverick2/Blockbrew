import {
  Transaction,
  TransactionResponse,
  TransactionType,
} from "@/types";
import { CHAIN_MAP } from "@/config/chains";

// Helper to determine transaction type
function getTransactionType(method?: string, value?: string): TransactionType {
  if (!method) {
    return value && parseFloat(value) > 0 ? "transfer" : "contract";
  }

  const methodLower = method.toLowerCase();
  if (methodLower.includes("swap")) return "swap";
  if (methodLower.includes("stake") || methodLower.includes("deposit")) return "stake";
  if (methodLower.includes("unstake") || methodLower.includes("withdraw")) return "unstake";
  if (methodLower.includes("claim")) return "claim";
  if (methodLower.includes("delegate")) return "delegate";
  if (methodLower.includes("approve")) return "approval";
  if (methodLower.includes("mint")) return "mint";
  if (methodLower.includes("burn")) return "burn";
  if (methodLower.includes("bridge")) return "bridge";
  if (methodLower.includes("transfer")) return "transfer";
  return "contract";
}

// Blockscout API URLs (free, no API key needed)
const BLOCKSCOUT_URLS: Record<string, string> = {
  ethereum: "https://eth.blockscout.com",
  polygon: "https://polygon.blockscout.com",
  arbitrum: "https://arbitrum.blockscout.com",
  optimism: "https://optimism.blockscout.com",
  base: "https://base.blockscout.com",
};

// Etherscan-style API URLs (for chains without Blockscout)
const ETHERSCAN_STYLE_URLS: Record<string, string> = {
  bsc: "https://api.bscscan.com/api",
  avalanche: "https://api.snowtrace.io/api",
};

// Fetch via Blockscout (EVM chains)
async function fetchBlockscoutTransactions(
  address: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const baseUrl = BLOCKSCOUT_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Chain ${chainId} not supported via Blockscout`);
  }

  const chain = CHAIN_MAP[chainId];

  try {
    const res = await fetch(
      `${baseUrl}/api/v2/addresses/${address}/transactions`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Address not found on ${chain.name}`);
      } else if (res.status === 422 || res.status === 400) {
        throw new Error(`Invalid address format for ${chain.name}`);
      } else if (res.status === 429) {
        throw new Error("Rate limited. Please try again in a moment");
      }
      throw new Error(`Failed to fetch from ${chain.name} (${res.status})`);
    }

    const data = await res.json();
    const items = data.items || [];
    const transactions: Transaction[] = [];

    for (const tx of items) {
      const valueWei = BigInt(tx.value || "0");
      const valueInEth = Number(valueWei) / Math.pow(10, chain.decimals);

      let feeInEth = 0;
      if (tx.fee?.value) {
        const feeWei = BigInt(tx.fee.value);
        feeInEth = Number(feeWei) / Math.pow(10, chain.decimals);
      }

      const timestamp = tx.timestamp
        ? new Date(tx.timestamp).getTime() / 1000
        : Date.now() / 1000;

      transactions.push({
        id: `${chainId}-${tx.hash}`,
        hash: tx.hash,
        chain: chainId,
        blockNumber: tx.block_number || 0,
        timestamp,
        from: tx.from?.hash?.toLowerCase() || "",
        to: tx.to?.hash?.toLowerCase() || "",
        value: valueInEth.toString(),
        fee: feeInEth.toString(),
        type: getTransactionType(tx.method, tx.value),
        status: tx.status === "ok" || tx.result === "success" ? "success" : "failed",
        method: tx.method || undefined,
        tokenSymbol: chain.symbol,
        gasUsed: tx.gas_used?.toString(),
        nonce: tx.nonce,
        raw: tx,
      });
    }

    // Also fetch token transfers
    try {
      const tokenRes = await fetch(
        `${baseUrl}/api/v2/addresses/${address}/token-transfers`,
        { headers: { Accept: "application/json" } }
      );

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const tokenItems = tokenData.items || [];

        for (const transfer of tokenItems) {
          const decimals = parseInt(transfer.token?.decimals || "18");
          const valueRaw = BigInt(transfer.total?.value || "0");
          const value = Number(valueRaw) / Math.pow(10, decimals);

          const timestamp = transfer.timestamp
            ? new Date(transfer.timestamp).getTime() / 1000
            : Date.now() / 1000;

          const existingTx = transactions.find(t => t.hash === transfer.tx_hash);
          if (!existingTx) {
            transactions.push({
              id: `${chainId}-${transfer.tx_hash}-token`,
              hash: transfer.tx_hash,
              chain: chainId,
              blockNumber: transfer.block_number || 0,
              timestamp,
              from: transfer.from?.hash?.toLowerCase() || "",
              to: transfer.to?.hash?.toLowerCase() || "",
              value: value.toString(),
              fee: "0",
              type: "transfer",
              status: "success",
              tokenSymbol: transfer.token?.symbol || "TOKEN",
              tokenName: transfer.token?.name,
              tokenDecimals: decimals,
              tokenAddress: transfer.token?.address,
              raw: transfer,
            });
          }
        }
      }
    } catch {
      // Token transfers are optional
    }

    // Sort by timestamp descending
    transactions.sort((a, b) => {
      const tsA = typeof a.timestamp === "string" ? parseInt(a.timestamp) : a.timestamp;
      const tsB = typeof b.timestamp === "string" ? parseInt(b.timestamp) : b.timestamp;
      return tsB - tsA;
    });

    return {
      transactions: transactions.slice(0, pageSize),
      totalCount: transactions.length,
      page,
      pageSize,
      hasMore: transactions.length > pageSize,
    };
  } catch (error) {
    console.error(`Error fetching ${chainId} transactions:`, error);
    throw error;
  }
}

// Fetch via Etherscan-style API (BSC, etc.)
async function fetchEtherscanStyleTransactions(
  address: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const baseUrl = ETHERSCAN_STYLE_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Chain ${chainId} not supported via Etherscan-style API`);
  }

  const chain = CHAIN_MAP[chainId];

  try {
    // Fetch normal transactions
    const res = await fetch(
      `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc`
    );

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error("Rate limited. Please try again in a moment");
      }
      throw new Error(`Failed to fetch from ${chain.name} (${res.status})`);
    }

    const data = await res.json();
    if (data.status !== "1" && data.message !== "No transactions found") {
      if (data.message?.includes("Invalid address")) {
        throw new Error(`Invalid address format for ${chain.name}`);
      }
      throw new Error(data.message || `Failed to fetch from ${chain.name}`);
    }

    const items = data.result || [];
    const transactions: Transaction[] = [];

    for (const tx of items) {
      const valueWei = BigInt(tx.value || "0");
      const valueInEth = Number(valueWei) / Math.pow(10, chain.decimals);

      const gasPrice = BigInt(tx.gasPrice || "0");
      const gasUsed = BigInt(tx.gasUsed || "0");
      const feeWei = gasPrice * gasUsed;
      const feeInEth = Number(feeWei) / Math.pow(10, chain.decimals);

      transactions.push({
        id: `${chainId}-${tx.hash}`,
        hash: tx.hash,
        chain: chainId,
        blockNumber: parseInt(tx.blockNumber) || 0,
        timestamp: parseInt(tx.timeStamp) || Date.now() / 1000,
        from: tx.from?.toLowerCase() || "",
        to: tx.to?.toLowerCase() || "",
        value: valueInEth.toString(),
        fee: feeInEth.toString(),
        type: getTransactionType(tx.functionName, tx.value),
        status: tx.isError === "0" ? "success" : "failed",
        method: tx.functionName?.split("(")[0] || undefined,
        tokenSymbol: chain.symbol,
        gasUsed: tx.gasUsed,
        nonce: parseInt(tx.nonce),
        raw: tx,
      });
    }

    return {
      transactions,
      totalCount: transactions.length,
      page,
      pageSize,
      hasMore: transactions.length === pageSize,
    };
  } catch (error) {
    console.error(`Error fetching ${chainId} transactions:`, error);
    throw error;
  }
}

// Solana Fetcher
async function fetchSolanaTransactions(
  address: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  try {
    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [address, { limit: pageSize }],
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const signatures = data.result || [];
    const transactions: Transaction[] = signatures.map((sig: Record<string, unknown>) => ({
      id: `solana-${sig.signature}`,
      hash: sig.signature as string,
      chain: "solana",
      blockNumber: sig.slot as number,
      timestamp: (sig.blockTime as number) || Date.now() / 1000,
      from: address,
      to: "",
      value: "0",
      fee: "0",
      type: sig.err ? "unknown" : "transfer",
      status: sig.err ? "failed" : "success",
      tokenSymbol: "SOL",
      raw: sig,
    }));

    return {
      transactions,
      totalCount: transactions.length,
      page,
      pageSize,
      hasMore: transactions.length === pageSize,
    };
  } catch (error) {
    console.error("Error fetching Solana transactions:", error);
    throw error;
  }
}

// Bitcoin Fetcher via Blockchair
async function fetchBitcoinTransactions(
  address: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  try {
    const res = await fetch(
      `https://api.blockchair.com/bitcoin/dashboards/address/${address}?limit=${pageSize}`
    );
    const data = await res.json();

    if (!data.data?.[address]) {
      return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
    }

    const addressData = data.data[address];
    const txHashes = addressData.transactions || [];

    const transactions: Transaction[] = txHashes.map((hash: string) => ({
      id: `bitcoin-${hash}`,
      hash,
      chain: "bitcoin",
      blockNumber: 0,
      timestamp: Date.now() / 1000,
      from: address,
      to: "",
      value: "0",
      fee: "0",
      type: "transfer" as TransactionType,
      status: "success" as const,
      tokenSymbol: "BTC",
    }));

    return {
      transactions,
      totalCount: addressData.address?.transaction_count || transactions.length,
      page,
      pageSize,
      hasMore: transactions.length === pageSize,
    };
  } catch (error) {
    console.error("Error fetching Bitcoin transactions:", error);
    throw error;
  }
}

// Polkadot/Bittensor via Subscan
async function fetchSubstrateTransactions(
  address: string,
  chainId: "polkadot" | "bittensor",
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const apiUrls: Record<string, string> = {
    polkadot: "https://polkadot.api.subscan.io",
    bittensor: "https://bittensor.api.subscan.io",
  };

  const chain = CHAIN_MAP[chainId];

  try {
    const res = await fetch(`${apiUrls[chainId]}/api/v2/scan/transfers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, row: pageSize, page: page - 1 }),
    });

    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message || "API error");

    const transfers = data.data?.transfers || [];
    const transactions: Transaction[] = transfers.map((tx: Record<string, unknown>) => {
      const value = parseFloat(tx.amount as string) / Math.pow(10, chain.decimals);
      const fee = tx.fee ? parseFloat(tx.fee as string) / Math.pow(10, chain.decimals) : 0;

      return {
        id: `${chainId}-${tx.hash}-${tx.extrinsic_index}`,
        hash: tx.hash as string,
        chain: chainId,
        blockNumber: tx.block_num as number,
        timestamp: tx.block_timestamp as number,
        from: tx.from as string,
        to: tx.to as string,
        value: value.toString(),
        fee: fee.toString(),
        type: "transfer" as TransactionType,
        status: tx.success ? "success" : "failed",
        tokenSymbol: (tx.asset_symbol as string) || chain.symbol,
        raw: tx,
      };
    });

    return {
      transactions,
      totalCount: data.data?.count || transactions.length,
      page,
      pageSize,
      hasMore: transactions.length === pageSize,
    };
  } catch (error) {
    console.error(`Error fetching ${chainId} transactions:`, error);
    throw error;
  }
}

// Cosmos/Osmosis
async function fetchCosmosTransactions(
  address: string,
  chainId: "cosmos" | "osmosis",
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const chain = CHAIN_MAP[chainId];
  const chainName = chainId === "cosmos" ? "cosmos" : "osmosis";

  try {
    const res = await fetch(
      `https://lcd-${chainName}.cosmostation.io/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=${pageSize}&order_by=ORDER_BY_DESC`
    );

    const data = await res.json();
    const txs = data.tx_responses || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactions: Transaction[] = txs.map((tx: any) => {
      const txBody = tx.tx?.body || {};
      const msgs = txBody.messages || [];
      let value = "0";
      let to = "";
      let type: TransactionType = "unknown";

      for (const msg of msgs) {
        const msgType = msg["@type"] || "";
        if (msgType.includes("MsgSend")) {
          type = "transfer";
          to = msg.to_address || "";
          const amounts = msg.amount || [];
          if (amounts.length > 0) {
            value = (parseFloat(amounts[0].amount) / Math.pow(10, chain.decimals)).toString();
          }
        } else if (msgType.includes("MsgDelegate")) type = "delegate";
        else if (msgType.includes("MsgUndelegate")) type = "undelegate";
        else if (msgType.includes("MsgWithdrawDelegatorReward")) type = "claim";
        else if (msgType.includes("MsgSwap")) type = "swap";
      }

      const feeAmount = tx.tx?.auth_info?.fee?.amount?.[0]?.amount || "0";
      const fee = (parseFloat(feeAmount) / Math.pow(10, chain.decimals)).toString();

      return {
        id: `${chainId}-${tx.txhash}`,
        hash: tx.txhash as string,
        chain: chainId,
        blockNumber: parseInt(tx.height as string),
        timestamp: new Date(tx.timestamp as string).getTime() / 1000,
        from: address,
        to,
        value,
        fee,
        type,
        status: (tx.code as number) === 0 ? "success" : "failed",
        tokenSymbol: chain.symbol,
        gasUsed: tx.gas_used as string,
        raw: tx,
      };
    });

    return {
      transactions,
      totalCount: parseInt(data.pagination?.total || "0") || transactions.length,
      page,
      pageSize,
      hasMore: transactions.length === pageSize,
    };
  } catch (error) {
    console.error(`Error fetching ${chainId} transactions:`, error);
    throw error;
  }
}

// Ronin
// Note: Ronin API is protected by Cloudflare and may not work from server-side
async function fetchRoninTransactions(
  address: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const cleanAddress = address.replace("ronin:", "0x");
  const chain = CHAIN_MAP["ronin"];

  try {
    // Use Ronin's Blockscout instance
    const res = await fetch(
      `https://explorer.roninchain.com/api/v2/addresses/${cleanAddress}/transactions`,
      { headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      // API may be blocked by Cloudflare
      console.warn("Ronin API returned error - may be blocked by Cloudflare");
      return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
    }

    // Check if response is HTML (Cloudflare challenge page)
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.warn("Ronin API returned HTML - likely Cloudflare challenge");
      return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
    }

    const data = await res.json();
    const items = data.items || [];

    const transactions: Transaction[] = items.map((tx: Record<string, unknown>) => {
      const valueWei = BigInt((tx.value as string) || "0");
      const value = Number(valueWei) / Math.pow(10, chain.decimals);

      return {
        id: `ronin-${tx.hash}`,
        hash: tx.hash as string,
        chain: "ronin",
        blockNumber: tx.block_number as number,
        timestamp: tx.timestamp ? new Date(tx.timestamp as string).getTime() / 1000 : Date.now() / 1000,
        from: (tx.from as { hash: string })?.hash || "",
        to: (tx.to as { hash: string })?.hash || "",
        value: value.toString(),
        fee: "0",
        type: getTransactionType(tx.method as string, tx.value as string),
        status: tx.status === "ok" ? "success" : "failed",
        tokenSymbol: "RON",
        raw: tx,
      };
    });

    return {
      transactions,
      totalCount: transactions.length,
      page,
      pageSize,
      hasMore: transactions.length === pageSize,
    };
  } catch (error) {
    // Don't throw - return empty result for Ronin since API is often blocked
    console.warn("Error fetching Ronin transactions (API may be blocked):", error);
    return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
  }
}

// Main fetch function
export async function fetchTransactions(
  address: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const chain = chainId.toLowerCase();

  switch (chain) {
    case "ethereum":
    case "polygon":
    case "arbitrum":
    case "optimism":
    case "base":
      return fetchBlockscoutTransactions(address, chain, page, pageSize);

    case "bsc":
    case "avalanche":
      return fetchEtherscanStyleTransactions(address, chain, page, pageSize);

    case "solana":
      return fetchSolanaTransactions(address, page, pageSize);

    case "bitcoin":
      return fetchBitcoinTransactions(address, page, pageSize);

    case "polkadot":
    case "bittensor":
      return fetchSubstrateTransactions(address, chain, page, pageSize);

    case "cosmos":
    case "osmosis":
      return fetchCosmosTransactions(address, chain, page, pageSize);

    case "ronin":
      return fetchRoninTransactions(address, page, pageSize);

    default:
      throw new Error(`Chain ${chainId} is not yet supported`);
  }
}

// Validate address for specific chain
export function validateAddress(address: string, chainId: string): boolean {
  if (!address || typeof address !== "string") return false;
  const trimmed = address.trim();
  const chain = chainId.toLowerCase();

  switch (chain) {
    case "ethereum":
    case "polygon":
    case "bsc":
    case "arbitrum":
    case "optimism":
    case "base":
    case "avalanche":
    case "ronin":
      return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
    case "bitcoin":
      return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed);
    case "solana":
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
    case "cosmos":
      return /^cosmos[a-zA-Z0-9]{38,45}$/.test(trimmed);
    case "osmosis":
      return /^osmo[a-zA-Z0-9]{38,45}$/.test(trimmed);
    case "polkadot":
    case "bittensor":
      return /^[1-9A-HJ-NP-Za-km-z]{46,48}$/.test(trimmed);
    default:
      return trimmed.length >= 20;
  }
}
