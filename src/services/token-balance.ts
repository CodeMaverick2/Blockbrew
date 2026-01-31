import { TokenBalance, TokenBalanceResponse } from "@/types";
import { CHAIN_MAP } from "@/config/chains";

// Blockscout API URLs for token balance fetching
const BLOCKSCOUT_URLS: Record<string, string> = {
  ethereum: "https://eth.blockscout.com",
  polygon: "https://polygon.blockscout.com",
  arbitrum: "https://arbitrum.blockscout.com",
  optimism: "https://optimism.blockscout.com",
  base: "https://base.blockscout.com",
  bsc: "https://bsc.blockscout.com",
  avalanche: "https://snowtrace.io",
};

export async function fetchTokenBalances(
  address: string,
  chainId: string
): Promise<TokenBalanceResponse> {
  const baseUrl = BLOCKSCOUT_URLS[chainId.toLowerCase()];

  if (!baseUrl) {
    // Chain doesn't support token balance fetching via Blockscout
    return { tokens: [] };
  }

  const chain = CHAIN_MAP[chainId];
  if (!chain) {
    return { tokens: [] };
  }

  try {
    // Fetch native balance
    const addressRes = await fetch(
      `${baseUrl}/api/v2/addresses/${address}`,
      { headers: { Accept: "application/json" } }
    );

    let nativeBalance: TokenBalance | null = null;

    if (addressRes.ok) {
      const addressData = await addressRes.json();
      const balanceWei = BigInt(addressData.coin_balance || "0");
      const balance = Number(balanceWei) / Math.pow(10, chain.decimals);

      if (balance > 0) {
        nativeBalance = {
          address: "native",
          symbol: chain.symbol,
          name: chain.name,
          decimals: chain.decimals,
          balance: balanceWei.toString(),
          balanceFormatted: balance.toFixed(6),
          chain: chainId,
          logoUrl: chain.icon,
        };
      }
    }

    // Fetch token balances
    const tokensRes = await fetch(
      `${baseUrl}/api/v2/addresses/${address}/token-balances`,
      { headers: { Accept: "application/json" } }
    );

    const tokens: TokenBalance[] = [];

    if (nativeBalance) {
      tokens.push(nativeBalance);
    }

    if (tokensRes.ok) {
      const tokensData = await tokensRes.json();

      for (const item of tokensData) {
        const token = item.token;
        if (!token) continue;

        const decimals = parseInt(token.decimals || "18");
        const balanceRaw = BigInt(item.value || "0");
        const balance = Number(balanceRaw) / Math.pow(10, decimals);

        if (balance > 0) {
          tokens.push({
            address: token.address,
            symbol: token.symbol || "???",
            name: token.name || "Unknown Token",
            decimals,
            balance: balanceRaw.toString(),
            balanceFormatted: formatTokenBalance(balance, decimals),
            chain: chainId,
            logoUrl: token.icon_url || undefined,
          });
        }
      }
    }

    // Sort by balance (native first, then by value)
    tokens.sort((a, b) => {
      if (a.address === "native") return -1;
      if (b.address === "native") return 1;
      const aVal = parseFloat(a.balanceFormatted.replace(/,/g, ""));
      const bVal = parseFloat(b.balanceFormatted.replace(/,/g, ""));
      return bVal - aVal;
    });

    return {
      tokens: tokens.slice(0, 20), // Limit to top 20 tokens
    };
  } catch (error) {
    console.error(`Error fetching token balances for ${chainId}:`, error);
    return { tokens: [] };
  }
}

function formatTokenBalance(balance: number, decimals: number): string {
  if (balance === 0) return "0";

  if (balance < 0.000001) {
    return balance.toExponential(2);
  }

  if (balance >= 1000000) {
    return (balance / 1000000).toFixed(2) + "M";
  }

  if (balance >= 1000) {
    return (balance / 1000).toFixed(2) + "K";
  }

  // Determine appropriate decimal places
  const precision = balance >= 1 ? 4 : Math.min(decimals, 8);
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

// Check if chain supports token balance fetching
export function supportsTokenBalances(chainId: string): boolean {
  return chainId.toLowerCase() in BLOCKSCOUT_URLS;
}
