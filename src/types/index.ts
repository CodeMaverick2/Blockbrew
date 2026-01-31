// Chain Configuration
export interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  decimals: number;
  explorerUrl: string;
  rpcUrl?: string;
  apiUrl?: string;
  description: string;
  isTestnet?: boolean;
}

// Transaction Types
export type TransactionType =
  | "transfer"
  | "swap"
  | "stake"
  | "unstake"
  | "claim"
  | "delegate"
  | "undelegate"
  | "vote"
  | "contract"
  | "approval"
  | "mint"
  | "burn"
  | "bridge"
  | "deposit"
  | "withdraw"
  | "unknown";

export type TransactionStatus = "success" | "failed" | "pending";

// Base Transaction Interface
export interface Transaction {
  id: string;
  hash: string;
  chain: string;
  blockNumber: number | string;
  timestamp: number | string;
  from: string;
  to: string;
  value: string;
  valueUsd?: string;
  fee: string;
  feeUsd?: string;
  type: TransactionType;
  status: TransactionStatus;
  method?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimals?: number;
  tokenAddress?: string;
  nonce?: number;
  gasUsed?: string;
  gasPrice?: string;
  gasLimit?: string;
  inputData?: string;
  logs?: TransactionLog[];
  internalTxs?: InternalTransaction[];
  raw?: Record<string, unknown>;
}

export interface TransactionLog {
  logIndex: number;
  address: string;
  topics: string[];
  data: string;
  decoded?: {
    name: string;
    params: Record<string, unknown>;
  };
}

export interface InternalTransaction {
  from: string;
  to: string;
  value: string;
  type: string;
  gasUsed?: string;
}

// Token Transfer
export interface TokenTransfer {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimals: number;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  valueUsd?: string;
}

// Wallet Info
export interface WalletInfo {
  address: string;
  chain: string;
  balance?: string;
  balanceUsd?: string;
  tokenCount?: number;
  transactionCount?: number;
  firstTxDate?: string;
  lastTxDate?: string;
}

// API Response Types
export interface TransactionResponse {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Awakens CSV Format
// Based on the Awakens crypto tax format
export interface AwakensCSVRow {
  Date: string; // ISO 8601 format
  Type: string; // Buy, Sell, Transfer, etc.
  "Sent Currency": string;
  "Sent Amount": string;
  "Sent Cost Basis": string;
  "Received Currency": string;
  "Received Amount": string;
  "Received Cost Basis": string;
  "Fee Currency": string;
  "Fee Amount": string;
  "Fee Cost Basis": string;
  "Net Worth Amount": string;
  "Net Worth Currency": string;
  Description: string;
  "TX Hash": string;
  "TX Src": string; // Source chain/exchange
  "TX Dest": string; // Destination chain/exchange
}

// Filter Options
export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType[];
  status?: TransactionStatus[];
  minValue?: number;
  maxValue?: number;
  search?: string;
}

// Sort Options
export interface SortOptions {
  column: keyof Transaction;
  direction: "asc" | "desc";
}

// Pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

// Theme
export type Theme = "light" | "dark" | "system";

// Toast/Notification
export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

// Chain Adapter Interface
export interface ChainAdapter {
  chain: ChainConfig;
  fetchTransactions(
    address: string,
    page?: number,
    pageSize?: number
  ): Promise<TransactionResponse>;
  validateAddress(address: string): boolean;
  getExplorerUrl(hash: string, type: "address" | "tx"): string;
}

// Export Format Types
export type ExportFormat = "awaken" | "koinly" | "cointracker" | "taxbit";

export interface ExportFormatConfig {
  id: ExportFormat;
  name: string;
  description: string;
  fileExtension: string;
}

// Koinly CSV Format
export interface KoinlyCSVRow {
  Date: string;
  "Sent Amount": string;
  "Sent Currency": string;
  "Received Amount": string;
  "Received Currency": string;
  "Fee Amount": string;
  "Fee Currency": string;
  "Net Worth Amount": string;
  "Net Worth Currency": string;
  Label: string;
  Description: string;
  TxHash: string;
}

// CoinTracker CSV Format
export interface CoinTrackerCSVRow {
  Date: string;
  "Received Quantity": string;
  "Received Currency": string;
  "Sent Quantity": string;
  "Sent Currency": string;
  "Fee Amount": string;
  "Fee Currency": string;
  Tag: string;
}

// TaxBit CSV Format
export interface TaxBitCSVRow {
  "Date and Time": string;
  "Transaction Type": string;
  "Sent Quantity": string;
  "Sent Currency": string;
  "Sending Source": string;
  "Received Quantity": string;
  "Received Currency": string;
  "Receiving Destination": string;
  "Fee": string;
  "Fee Currency": string;
  "Exchange Transaction ID": string;
  "Blockchain Transaction Hash": string;
}

// Address Memory Types
export interface SavedAddress {
  address: string;
  chainId: string;
  label?: string;
  isBookmarked: boolean;
  lastSearched: number;
  searchCount: number;
}

export interface AddressMemoryState {
  recentAddresses: SavedAddress[];
  bookmarkedAddresses: SavedAddress[];
}

// Token Balance Types
export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  balanceUsd?: string;
  logoUrl?: string;
  chain: string;
}

export interface TokenBalanceResponse {
  tokens: TokenBalance[];
  totalValueUsd?: string;
}

// Multi-Chain Search Types
export interface ChainSearchResult {
  chainId: string;
  transactions: Transaction[];
  totalCount: number;
  isLoading: boolean;
  error?: string;
}

export interface MultiChainSearchState {
  isMultiChainMode: boolean;
  results: Record<string, ChainSearchResult>;
  aggregatedStats: AggregatedStats;
}

export interface AggregatedStats {
  totalTransactions: number;
  totalReceived: number;
  totalSent: number;
  totalFees: number;
  chainBreakdown: Record<string, {
    count: number;
    received: number;
    sent: number;
    fees: number;
  }>;
}

// Analytics Types
export interface AnalyticsData {
  gasOverTime: GasDataPoint[];
  frequencyByDay: FrequencyDataPoint[];
  flowData: FlowDataPoint[];
  summary: AnalyticsSummary;
}

export interface GasDataPoint {
  date: string;
  totalGas: number;
  avgGas: number;
  txCount: number;
}

export interface FrequencyDataPoint {
  day: string;
  count: number;
  incoming: number;
  outgoing: number;
}

export interface FlowDataPoint {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface AnalyticsSummary {
  totalGasSpent: number;
  avgGasPerTx: number;
  txCountByType: Record<TransactionType, number>;
  mostActiveDay: string;
  peakHour: number;
}

// Analytics Time Range
export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "all";

// Extended Filter Options
export interface ExtendedTransactionFilters extends TransactionFilters {
  datePreset?: "7d" | "30d" | "90d" | "custom";
}
