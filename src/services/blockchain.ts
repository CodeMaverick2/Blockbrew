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

// Multiple API endpoints per chain for fallback
const CHAIN_ENDPOINTS: Record<string, string[]> = {
  // EVM Chains - Blockscout + alternatives
  ethereum: [
    "https://eth.blockscout.com",
    "https://api.etherscan.io/api",
  ],
  polygon: [
    "https://polygon.blockscout.com",
    "https://api.polygonscan.com/api",
  ],
  arbitrum: [
    "https://arbitrum.blockscout.com",
    "https://api.arbiscan.io/api",
  ],
  optimism: [
    "https://optimism.blockscout.com",
    "https://api-optimistic.etherscan.io/api",
  ],
  base: [
    "https://base.blockscout.com",
    "https://api.basescan.org/api",
  ],
  bsc: [
    "https://api.bscscan.com/api",
    "https://bsc.blockscout.com",
  ],
  avalanche: [
    "https://api.snowtrace.io/api",
    "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api",
  ],
  // Solana - official RPC first (most reliable)
  solana: [
    "https://api.mainnet-beta.solana.com",
  ],
  // Bitcoin
  bitcoin: [
    "https://api.blockchair.com/bitcoin",
    "https://blockchain.info",
  ],
  // Substrate chains
  polkadot: [
    "https://polkadot.api.subscan.io",
  ],
  bittensor: [
    "https://bittensor.api.subscan.io",
  ],
  // Cosmos ecosystem
  cosmos: [
    "https://cosmos-rest.publicnode.com",
    "https://rest.cosmos.directory/cosmoshub",
    "https://lcd-cosmoshub.keplr.app",
  ],
  osmosis: [
    "https://osmosis-rest.publicnode.com",
    "https://rest.cosmos.directory/osmosis",
    "https://lcd-osmosis.keplr.app",
  ],
  // Ronin
  ronin: [
    "https://explorer.roninchain.com",
  ],
};

// Generic fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Parse Blockscout API response
function parseBlockscoutResponse(
  data: { items?: unknown[] },
  address: string,
  chainId: string,
  chain: { decimals: number; symbol: string }
): Transaction[] {
  const items = data.items || [];
  const transactions: Transaction[] = [];

  for (const tx of items as Record<string, unknown>[]) {
    const valueWei = BigInt((tx.value as string) || "0");
    const valueInEth = Number(valueWei) / Math.pow(10, chain.decimals);

    let feeInEth = 0;
    const fee = tx.fee as { value?: string } | undefined;
    if (fee?.value) {
      const feeWei = BigInt(fee.value);
      feeInEth = Number(feeWei) / Math.pow(10, chain.decimals);
    }

    const timestamp = tx.timestamp
      ? new Date(tx.timestamp as string).getTime() / 1000
      : Date.now() / 1000;

    const fromObj = tx.from as { hash?: string } | undefined;
    const toObj = tx.to as { hash?: string } | undefined;

    transactions.push({
      id: `${chainId}-${tx.hash}`,
      hash: tx.hash as string,
      chain: chainId,
      blockNumber: (tx.block_number as number) || 0,
      timestamp,
      from: fromObj?.hash?.toLowerCase() || "",
      to: toObj?.hash?.toLowerCase() || "",
      value: valueInEth.toString(),
      fee: feeInEth.toString(),
      type: getTransactionType(tx.method as string, tx.value as string),
      status: tx.status === "ok" || tx.result === "success" ? "success" : "failed",
      method: (tx.method as string) || undefined,
      tokenSymbol: chain.symbol,
      gasUsed: tx.gas_used?.toString(),
      nonce: tx.nonce as number,
      raw: tx,
    });
  }

  return transactions;
}

// Parse Etherscan-style API response
function parseEtherscanResponse(
  data: { result?: unknown[] },
  chainId: string,
  chain: { decimals: number; symbol: string }
): Transaction[] {
  const items = data.result || [];
  const transactions: Transaction[] = [];

  for (const tx of items as Record<string, string>[]) {
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

  return transactions;
}

// Fetch EVM transactions with fallback
async function fetchEVMTransactions(
  address: string,
  chainId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const endpoints = CHAIN_ENDPOINTS[chainId] || [];
  const chain = CHAIN_MAP[chainId];

  if (!chain) {
    throw new Error(`Chain ${chainId} not configured`);
  }

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      // Determine API type based on URL
      const isBlockscout = endpoint.includes("blockscout");
      const isEtherscan = endpoint.includes("scan") || endpoint.includes("etherscan") || endpoint.includes("snowtrace") || endpoint.includes("routescan");

      let url: string;
      if (isBlockscout) {
        url = `${endpoint}/api/v2/addresses/${address}/transactions`;
      } else if (isEtherscan) {
        url = `${endpoint}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc`;
      } else {
        continue;
      }

      const res = await fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
      });

      // Check for HTML response (error page)
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        lastError = new Error("API returned HTML instead of JSON");
        continue;
      }

      if (!res.ok) {
        if (res.status === 429) {
          lastError = new Error("Rate limited");
          continue;
        }
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();

      let transactions: Transaction[];

      if (isBlockscout) {
        transactions = parseBlockscoutResponse(data, address, chainId, chain);
      } else {
        // Etherscan-style response
        if (data.status !== "1" && data.message !== "No transactions found") {
          if (data.message === "NOTOK" || data.result?.includes?.("rate")) {
            lastError = new Error("Rate limited or API key required");
            continue;
          }
          if (data.result?.length === 0 || data.message === "No transactions found") {
            return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
          }
          lastError = new Error(data.message || "API error");
          continue;
        }
        transactions = parseEtherscanResponse(data, chainId, chain);
      }

      // Also try to fetch token transfers for Blockscout
      if (isBlockscout) {
        try {
          const tokenRes = await fetchWithTimeout(
            `${endpoint}/api/v2/addresses/${address}/token-transfers`,
            { headers: { Accept: "application/json" } }
          );

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            const tokenItems = tokenData.items || [];

            for (const transfer of tokenItems as Record<string, unknown>[]) {
              const token = transfer.token as { decimals?: string; symbol?: string; name?: string; address?: string } | undefined;
              const total = transfer.total as { value?: string } | undefined;
              const decimals = parseInt(token?.decimals || "18");
              const valueRaw = BigInt(total?.value || "0");
              const value = Number(valueRaw) / Math.pow(10, decimals);

              const timestamp = transfer.timestamp
                ? new Date(transfer.timestamp as string).getTime() / 1000
                : Date.now() / 1000;

              const existingTx = transactions.find(t => t.hash === transfer.tx_hash);
              if (!existingTx) {
                const fromObj = transfer.from as { hash?: string } | undefined;
                const toObj = transfer.to as { hash?: string } | undefined;

                transactions.push({
                  id: `${chainId}-${transfer.tx_hash}-token`,
                  hash: transfer.tx_hash as string,
                  chain: chainId,
                  blockNumber: (transfer.block_number as number) || 0,
                  timestamp,
                  from: fromObj?.hash?.toLowerCase() || "",
                  to: toObj?.hash?.toLowerCase() || "",
                  value: value.toString(),
                  fee: "0",
                  type: "transfer",
                  status: "success",
                  tokenSymbol: token?.symbol || "TOKEN",
                  tokenName: token?.name,
                  tokenDecimals: decimals,
                  tokenAddress: token?.address,
                  raw: transfer,
                });
              }
            }
          }
        } catch {
          // Token transfers are optional
        }
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
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.warn(`${chainId} endpoint failed (${endpoint}), trying next...`);
      continue;
    }
  }

  // All endpoints failed
  console.error(`All ${chainId} endpoints failed:`, lastError);
  throw lastError || new Error(`Failed to fetch from ${chain.name}`);
}

// Solana Fetcher with multiple endpoints
async function fetchSolanaTransactions(
  address: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const endpoints = CHAIN_ENDPOINTS.solana;
  let lastError: Error | null = null;

  for (const rpcUrl of endpoints) {
    try {
      const res = await fetchWithTimeout(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [address, { limit: pageSize }],
        }),
      });

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();

      if (data.error) {
        if (data.error.code === 403 || data.error.code === 429) {
          lastError = new Error(data.error.message);
          continue;
        }
        throw new Error(data.error.message);
      }

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
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.warn(`Solana RPC failed (${rpcUrl}), trying next...`);
      continue;
    }
  }

  console.error("All Solana RPC endpoints failed:", lastError);
  throw lastError || new Error("Failed to fetch Solana transactions");
}

// Bitcoin Fetcher with fallback
async function fetchBitcoinTransactions(
  address: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const endpoints = CHAIN_ENDPOINTS.bitcoin;
  let lastError: Error | null = null;

  for (const baseUrl of endpoints) {
    try {
      let url: string;
      if (baseUrl.includes("blockchair")) {
        url = `${baseUrl}/dashboards/address/${address}?limit=${pageSize}`;
      } else if (baseUrl.includes("blockchain.info")) {
        url = `${baseUrl}/rawaddr/${address}?limit=${pageSize}`;
      } else {
        continue;
      }

      const res = await fetchWithTimeout(url);

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();

      let transactions: Transaction[] = [];

      if (baseUrl.includes("blockchair")) {
        if (!data.data?.[address]) {
          return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
        }
        const addressData = data.data[address];
        const txHashes = addressData.transactions || [];
        transactions = txHashes.map((hash: string) => ({
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
      } else if (baseUrl.includes("blockchain.info")) {
        const txs = data.txs || [];
        transactions = txs.map((tx: Record<string, unknown>) => ({
          id: `bitcoin-${tx.hash}`,
          hash: tx.hash as string,
          chain: "bitcoin",
          blockNumber: (tx.block_height as number) || 0,
          timestamp: (tx.time as number) || Date.now() / 1000,
          from: address,
          to: "",
          value: "0",
          fee: "0",
          type: "transfer" as TransactionType,
          status: "success" as const,
          tokenSymbol: "BTC",
          raw: tx,
        }));
      }

      return {
        transactions,
        totalCount: transactions.length,
        page,
        pageSize,
        hasMore: transactions.length === pageSize,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.warn(`Bitcoin endpoint failed (${baseUrl}), trying next...`);
      continue;
    }
  }

  console.error("All Bitcoin endpoints failed:", lastError);
  throw lastError || new Error("Failed to fetch Bitcoin transactions");
}

// Substrate (Polkadot/Bittensor) Fetcher
async function fetchSubstrateTransactions(
  address: string,
  chainId: "polkadot" | "bittensor",
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const endpoints = CHAIN_ENDPOINTS[chainId];
  const chain = CHAIN_MAP[chainId];
  let lastError: Error | null = null;

  for (const baseUrl of endpoints) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}/api/v2/scan/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, row: pageSize, page: page - 1 }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        lastError = new Error("API returned non-JSON response");
        continue;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        lastError = new Error("Invalid JSON response");
        continue;
      }

      if (data.code !== 0) {
        if (data.message?.includes("no data") || data.message?.includes("not found")) {
          return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
        }
        lastError = new Error(data.message || "API error");
        continue;
      }

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
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.warn(`${chainId} endpoint failed, trying next...`);
      continue;
    }
  }

  console.error(`All ${chainId} endpoints failed:`, lastError);
  throw lastError || new Error(`Failed to fetch ${chainId} transactions`);
}

// Cosmos/Osmosis Fetcher with multiple endpoints
async function fetchCosmosTransactions(
  address: string,
  chainId: "cosmos" | "osmosis",
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const endpoints = CHAIN_ENDPOINTS[chainId];
  const chain = CHAIN_MAP[chainId];
  let lastError: Error | null = null;

  for (const baseUrl of endpoints) {
    try {
      const url = `${baseUrl}/cosmos/tx/v1beta1/txs?events=message.sender='${address}'&pagination.limit=${pageSize}&order_by=ORDER_BY_DESC`;

      const res = await fetchWithTimeout(url);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        lastError = new Error("API returned HTML instead of JSON");
        continue;
      }

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

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
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.warn(`${chainId} endpoint failed (${baseUrl}), trying next...`);
      continue;
    }
  }

  console.error(`All ${chainId} endpoints failed:`, lastError);
  throw lastError || new Error(`Failed to fetch from ${chainId}`);
}

// Ronin Fetcher
async function fetchRoninTransactions(
  address: string,
  page: number = 1,
  pageSize: number = 50
): Promise<TransactionResponse> {
  const cleanAddress = address.replace("ronin:", "0x");
  const chain = CHAIN_MAP["ronin"];
  const endpoints = CHAIN_ENDPOINTS.ronin;

  for (const baseUrl of endpoints) {
    try {
      const res = await fetchWithTimeout(
        `${baseUrl}/api/v2/addresses/${cleanAddress}/transactions`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        console.warn("Ronin API returned error - may be blocked by Cloudflare");
        return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
      }

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

        const fromObj = tx.from as { hash?: string } | undefined;
        const toObj = tx.to as { hash?: string } | undefined;

        return {
          id: `ronin-${tx.hash}`,
          hash: tx.hash as string,
          chain: "ronin",
          blockNumber: tx.block_number as number,
          timestamp: tx.timestamp ? new Date(tx.timestamp as string).getTime() / 1000 : Date.now() / 1000,
          from: fromObj?.hash || "",
          to: toObj?.hash || "",
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
      console.warn("Error fetching Ronin transactions (API may be blocked):", error);
      return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
    }
  }

  return { transactions: [], totalCount: 0, page, pageSize, hasMore: false };
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
    case "bsc":
    case "avalanche":
      return fetchEVMTransactions(address, chain, page, pageSize);

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
