import { ChainConfig } from "@/types";

// Local chain logos for faster loading
export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    icon: "/chains/ethereum.svg",
    color: "#627EEA",
    decimals: 18,
    explorerUrl: "https://etherscan.io",
    description: "The leading smart contract platform",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    icon: "/chains/polygon.svg",
    color: "#8247E5",
    decimals: 18,
    explorerUrl: "https://polygonscan.com",
    description: "Ethereum scaling solution",
  },
  {
    id: "bsc",
    name: "BNB Chain",
    symbol: "BNB",
    icon: "/chains/bnb.svg",
    color: "#F3BA2F",
    decimals: 18,
    explorerUrl: "https://bscscan.com",
    description: "Binance Smart Chain",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ETH",
    icon: "/chains/arbitrum.svg",
    color: "#28A0F0",
    decimals: 18,
    explorerUrl: "https://arbiscan.io",
    description: "Ethereum Layer 2 rollup",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "ETH",
    icon: "/chains/optimism.svg",
    color: "#FF0420",
    decimals: 18,
    explorerUrl: "https://optimistic.etherscan.io",
    description: "Ethereum optimistic rollup",
  },
  {
    id: "base",
    name: "Base",
    symbol: "ETH",
    icon: "/chains/base.png",
    color: "#0052FF",
    decimals: 18,
    explorerUrl: "https://basescan.org",
    description: "Coinbase Layer 2",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    icon: "/chains/avalanche.svg",
    color: "#E84142",
    decimals: 18,
    explorerUrl: "https://snowtrace.io",
    description: "High-speed smart contracts",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    icon: "/chains/solana.svg",
    color: "#00FFA3",
    decimals: 9,
    explorerUrl: "https://solscan.io",
    description: "High-performance blockchain",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    icon: "/chains/bitcoin.svg",
    color: "#F7931A",
    decimals: 8,
    explorerUrl: "https://blockchair.com/bitcoin",
    description: "The original cryptocurrency",
  },
  {
    id: "polkadot",
    name: "Polkadot",
    symbol: "DOT",
    icon: "/chains/polkadot.svg",
    color: "#E6007A",
    decimals: 10,
    explorerUrl: "https://polkadot.subscan.io",
    description: "Multi-chain network",
  },
  {
    id: "cosmos",
    name: "Cosmos",
    symbol: "ATOM",
    icon: "/chains/cosmos.svg",
    color: "#2E3148",
    decimals: 6,
    explorerUrl: "https://www.mintscan.io/cosmos",
    description: "Internet of blockchains",
  },
  {
    id: "osmosis",
    name: "Osmosis",
    symbol: "OSMO",
    icon: "/chains/osmosis.svg",
    color: "#5E12A0",
    decimals: 6,
    explorerUrl: "https://www.mintscan.io/osmosis",
    description: "Cosmos DEX",
  },
  {
    id: "bittensor",
    name: "Bittensor",
    symbol: "TAO",
    icon: "/chains/bittensor.png",
    color: "#000000",
    decimals: 9,
    explorerUrl: "https://taostats.io",
    description: "Decentralized AI network",
  },
  {
    id: "ronin",
    name: "Ronin",
    symbol: "RON",
    icon: "/chains/ronin.svg",
    color: "#1273EA",
    decimals: 18,
    explorerUrl: "https://app.roninchain.com",
    description: "Gaming blockchain",
  },
];

export const CHAIN_MAP = SUPPORTED_CHAINS.reduce(
  (acc, chain) => {
    acc[chain.id] = chain;
    return acc;
  },
  {} as Record<string, ChainConfig>
);

export function getChainConfig(chainId: string): ChainConfig | undefined {
  return CHAIN_MAP[chainId.toLowerCase()];
}

export function getChainColor(chainId: string): string {
  return getChainConfig(chainId)?.color ?? "#6B7280";
}

export function getChainIcon(chainId: string): string {
  return getChainConfig(chainId)?.icon ?? "";
}
