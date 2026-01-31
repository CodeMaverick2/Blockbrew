"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ChainSelector } from "@/components/chain-selector";
import { WalletInput } from "@/components/wallet-input";
import { TransactionTable } from "@/components/transaction-table";
import { StatsCards } from "@/components/stats-cards";
import { TransactionFilters } from "@/components/filters/transaction-filters";
import { AddressSidebar, AddressSidebarTrigger } from "@/components/address-memory/address-sidebar";
import { TokenBalancesSection } from "@/components/token-balances/token-balances-section";
import { MultiChainToggle } from "@/components/multi-chain/multi-chain-toggle";
import { ChainResultsTabs } from "@/components/multi-chain/chain-results-tabs";
import { AggregatedStats } from "@/components/multi-chain/aggregated-stats";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { useToast } from "@/components/ui/toast";
import { useTransactionFilters } from "@/hooks/use-transaction-filters";
import { useAddressMemory } from "@/hooks/use-address-memory";
import { useMultiChainSearch } from "@/hooks/use-multi-chain-search";
import { fetchTransactions } from "@/services/blockchain";
import { CHAIN_MAP, SUPPORTED_CHAINS } from "@/config/chains";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Shield,
  Download,
  BarChart3,
  List,
} from "lucide-react";

// Subtle animated background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{
            left: `${10 + (i % 4) * 22}%`,
            top: `${20 + Math.floor(i / 4) * 40}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="absolute h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ top: "40%" }}
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-white/[0.02]"
        style={{ filter: "blur(100px)" }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Live indicator
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-xs text-muted-foreground">Live data</span>
    </div>
  );
}

// Feature card
function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="p-5 rounded-xl bg-[#141414] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-white/70" />
      </div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Tab bar for switching between Transactions and Analytics
function ViewTabs({
  activeView,
  onViewChange,
}: {
  activeView: "transactions" | "analytics";
  onViewChange: (view: "transactions" | "analytics") => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <button
        onClick={() => onViewChange("transactions")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all",
          activeView === "transactions"
            ? "bg-white/[0.1] text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-4 w-4" />
        Transactions
      </button>
      <button
        onClick={() => onViewChange("analytics")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all",
          activeView === "analytics"
            ? "bg-white/[0.1] text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BarChart3 className="h-4 w-4" />
        Analytics
      </button>
    </div>
  );
}

export default function HomePage() {
  const [chainId, setChainId] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [searchTrigger, setSearchTrigger] = React.useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<"transactions" | "analytics">("transactions");
  const [activeMultiChainTab, setActiveMultiChainTab] = React.useState<string | null>(null);
  const { addToast } = useToast();

  // Hooks
  const filterHook = useTransactionFilters();
  const addressMemory = useAddressMemory();
  const multiChainSearch = useMultiChainSearch(address, searchTrigger > 0);

  // Single chain query
  const {
    data: transactionData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["transactions", chainId, address, searchTrigger],
    queryFn: async () => {
      if (!chainId || !address) return null;

      const allTransactions: Transaction[] = [];
      let page = 1;
      const maxPages = 3;
      let hasMore = true;

      while (hasMore && page <= maxPages) {
        const result = await fetchTransactions(address, chainId, page, 100);
        allTransactions.push(...result.transactions);
        hasMore = result.hasMore;
        page++;
        if (hasMore && page <= maxPages) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      return {
        transactions: allTransactions,
        totalCount: allTransactions.length,
      };
    },
    enabled: searchTrigger > 0 && !!chainId && !!address && !multiChainSearch.isMultiChainMode,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Get transactions based on mode
  const rawTransactions = React.useMemo(() => {
    if (multiChainSearch.isMultiChainMode) {
      if (activeMultiChainTab) {
        return multiChainSearch.results[activeMultiChainTab]?.transactions || [];
      }
      return multiChainSearch.allTransactions;
    }
    return transactionData?.transactions || [];
  }, [multiChainSearch, activeMultiChainTab, transactionData]);

  // Apply filters to transactions
  const transactions = React.useMemo(() => {
    return filterHook.applyFilters(rawTransactions);
  }, [rawTransactions, filterHook]);

  const handleSearch = () => {
    setSearchTrigger((prev) => prev + 1);
    setActiveView("transactions");

    // Save to address memory
    if (address && chainId) {
      addressMemory.addRecentAddress(address, chainId);
    }
  };

  const handleSelectSavedAddress = (savedAddress: string, savedChainId: string) => {
    setAddress(savedAddress);
    setChainId(savedChainId);
    setIsSidebarOpen(false);
    // Trigger search after state updates
    setTimeout(() => {
      setSearchTrigger((prev) => prev + 1);
    }, 100);
  };

  React.useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      // Provide user-friendly error messages
      let userMessage = errorMessage;
      if (errorMessage.includes("422") || errorMessage.includes("400")) {
        userMessage = "Invalid address format for this network";
      } else if (errorMessage.includes("429")) {
        userMessage = "Too many requests. Please wait a moment and try again";
      } else if (errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503")) {
        userMessage = "Network explorer is temporarily unavailable";
      } else if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
        userMessage = "Network error. Please check your connection";
      }

      addToast({
        type: "error",
        title: "Failed to fetch transactions",
        message: userMessage,
      });
    }
  }, [error, addToast]);

  const selectedChain = chainId ? CHAIN_MAP[chainId] : null;
  const isSearching = multiChainSearch.isMultiChainMode
    ? multiChainSearch.isLoading || multiChainSearch.isFetching
    : isLoading || isFetching;
  const hasResults = transactions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <AnimatedBackground />
      </div>

      <Header />

      {/* Address Memory Sidebar */}
      <AddressSidebar
        recentAddresses={addressMemory.recentAddresses}
        bookmarkedAddresses={addressMemory.bookmarkedAddresses}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectAddress={handleSelectSavedAddress}
        onToggleBookmark={addressMemory.toggleBookmark}
        onRemoveRecent={addressMemory.removeRecentAddress}
        onRemoveBookmark={addressMemory.removeBookmark}
        onUpdateLabel={addressMemory.updateLabel}
        onClearRecent={addressMemory.clearRecentAddresses}
      />

      <main className="flex-1 relative z-10">
        {/* Hero */}
        <section className="relative border-b border-white/[0.06] overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-3xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center mb-8"
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#141414] border border-white/[0.06]">
                  <LiveIndicator />
                  <span className="text-xs text-muted-foreground">
                    {SUPPORTED_CHAINS.length} networks
                  </span>
                </div>
              </motion.div>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center mb-10"
              >
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-4">
                  <span className="text-gradient">Track</span> your
                  <br />
                  transactions
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Multi-chain explorer with instant CSV export.
                  <span className="text-white/80"> Tax-ready.</span>
                </p>
              </motion.div>

              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="max-w-xl mx-auto mb-10"
              >
                <div className="p-5 rounded-2xl bg-[#111111] border border-white/[0.06]">
                  {/* Top row with saved addresses button */}
                  <div className="flex items-center justify-between mb-3">
                    <AddressSidebarTrigger
                      onClick={() => setIsSidebarOpen(true)}
                      hasAddresses={addressMemory.allAddresses.length > 0}
                      addressCount={addressMemory.allAddresses.length}
                    />

                    {/* Multi-chain toggle */}
                    <MultiChainToggle
                      isEnabled={multiChainSearch.isMultiChainMode}
                      onToggle={multiChainSearch.toggleMultiChainMode}
                      compatibleChainCount={multiChainSearch.potentialChainCount}
                      disabled={!multiChainSearch.isEvmCompatible}
                    />
                  </div>

                  <div className="space-y-3">
                    {!multiChainSearch.isMultiChainMode && (
                      <ChainSelector
                        value={chainId}
                        onChange={setChainId}
                        disabled={isSearching}
                      />
                    )}
                    <WalletInput
                      value={address}
                      onChange={setAddress}
                      onSubmit={handleSearch}
                      chainId={chainId}
                      isLoading={isSearching}
                      skipChainValidation={multiChainSearch.isMultiChainMode}
                    />
                  </div>

                  {/* Selected chain */}
                  <AnimatePresence>
                    {selectedChain && !multiChainSearch.isMultiChainMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/[0.06]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-5 h-5 rounded-full overflow-hidden bg-white/5">
                            <Image
                              src={selectedChain.icon}
                              alt={selectedChain.name}
                              fill
                              className="object-contain p-0.5"
                            />
                          </div>
                          <span className="text-sm">{selectedChain.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {selectedChain.symbol}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Removed duplicate chain grid - using Supported Networks section below */}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="container mx-auto px-4 py-10">
          <AnimatePresence mode="wait">
            {isSearching && searchTrigger > 0 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative mb-5">
                  <div className="w-12 h-12 rounded-full border border-white/10" />
                  <motion.div
                    className="absolute inset-0 w-12 h-12 rounded-full border-t border-white/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {multiChainSearch.isMultiChainMode
                    ? `Scanning ${multiChainSearch.compatibleChains.length} chains...`
                    : `Scanning ${selectedChain?.name}...`}
                </p>
              </motion.div>
            ) : hasResults || (multiChainSearch.isMultiChainMode && multiChainSearch.chainsWithResults.length > 0) ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Multi-chain results */}
                {multiChainSearch.isMultiChainMode && (
                  <>
                    <ChainResultsTabs
                      results={multiChainSearch.results}
                      activeChain={activeMultiChainTab}
                      onChainSelect={setActiveMultiChainTab}
                      chainsWithResults={multiChainSearch.chainsWithResults}
                    />
                    <AggregatedStats
                      stats={multiChainSearch.aggregatedStats}
                      isLoading={multiChainSearch.isLoading}
                    />
                  </>
                )}

                {/* Single chain stats */}
                {!multiChainSearch.isMultiChainMode && (
                  <StatsCards
                    transactions={transactions}
                    userAddress={address}
                    chainId={chainId}
                  />
                )}

                {/* Token Balances */}
                {!multiChainSearch.isMultiChainMode && (
                  <TokenBalancesSection address={address} chainId={chainId} />
                )}

                {/* View Tabs */}
                <div className="flex items-center justify-between">
                  <ViewTabs activeView={activeView} onViewChange={setActiveView} />
                </div>

                {/* Filters (only for transactions view) */}
                {activeView === "transactions" && (
                  <TransactionFilters
                    filters={filterHook.filters}
                    onDateChange={filterHook.setDateRange}
                    onDatePresetChange={filterHook.setDatePreset}
                    onTypeChange={filterHook.setTypeFilter}
                    onToggleType={filterHook.toggleType}
                    onToggleStatus={filterHook.toggleStatus}
                    onClearFilters={filterHook.clearFilters}
                    hasActiveFilters={filterHook.hasActiveFilters}
                    activeFilterCount={filterHook.activeFilterCount}
                    allTransactionTypes={filterHook.allTransactionTypes}
                  />
                )}

                {/* Content based on active view */}
                {activeView === "transactions" ? (
                  <TransactionTable
                    transactions={transactions}
                    userAddress={address}
                    chainId={activeMultiChainTab || chainId}
                  />
                ) : (
                  <AnalyticsDashboard
                    transactions={transactions}
                    userAddress={address}
                  />
                )}
              </motion.div>
            ) : searchTrigger > 0 && !isSearching ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="w-12 h-12 rounded-full bg-[#141414] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl text-muted-foreground">∅</span>
                </div>
                <p className="text-muted-foreground font-medium">No transactions found</p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm mx-auto">
                  {multiChainSearch.isMultiChainMode
                    ? "No activity found on any EVM chain for this address"
                    : "This address has no transaction history on the selected network"}
                </p>
                <p className="text-xs text-muted-foreground/40 mt-3">
                  Make sure the address and network are correct
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        {/* Supported Chains Section - Better Landing Page Design */}
        {!hasResults && (
          <section className="border-t border-white/[0.06] py-16">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
              >
                <span className="inline-block px-3 py-1 mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground bg-white/[0.03] rounded-full border border-white/[0.06]">
                  Multi-Chain Support
                </span>
                <h2 className="text-2xl md:text-3xl font-semibold mb-3">
                  One Explorer. {SUPPORTED_CHAINS.length} Networks.
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Track transactions across the most popular blockchains in one unified interface
                </p>
              </motion.div>

              {/* Chain Grid - Grouped by type */}
              <div className="max-w-4xl mx-auto space-y-8">
                {/* EVM Chains */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4 text-center">
                    EVM Compatible
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {SUPPORTED_CHAINS.slice(0, 7).map((chain, index) => (
                      <motion.button
                        key={chain.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => setChainId(chain.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                          "bg-[#111111] hover:bg-[#161616]",
                          chainId === chain.id
                            ? "border-white/20"
                            : "border-white/[0.04] hover:border-white/[0.08]"
                        )}
                      >
                        <div
                          className="relative w-8 h-8 rounded-lg overflow-hidden"
                          style={{ backgroundColor: `${chain.color}15` }}
                        >
                          <Image
                            src={chain.icon}
                            alt={chain.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <span className="text-xs font-medium">{chain.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Other Chains */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4 text-center">
                    Other Networks
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {SUPPORTED_CHAINS.slice(7).map((chain, index) => (
                      <motion.button
                        key={chain.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => setChainId(chain.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                          "bg-[#111111] hover:bg-[#161616]",
                          chainId === chain.id
                            ? "border-white/20"
                            : "border-white/[0.04] hover:border-white/[0.08]"
                        )}
                      >
                        <div
                          className="relative w-8 h-8 rounded-lg overflow-hidden"
                          style={{ backgroundColor: `${chain.color}15` }}
                        >
                          <Image
                            src={chain.icon}
                            alt={chain.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <span className="text-xs font-medium">{chain.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        {!hasResults && (
          <section className="border-t border-white/[0.06]">
            <div className="container mx-auto px-4 py-14">
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <FeatureCard
                  icon={Zap}
                  title="Real-time data"
                  description="Live transaction data from blockchain explorers"
                  index={0}
                />
                <FeatureCard
                  icon={Download}
                  title="Multi-format export"
                  description="Export to Awaken, Koinly, CoinTracker, TaxBit"
                  index={1}
                />
                <FeatureCard
                  icon={Shield}
                  title="Privacy first"
                  description="No data stored. Runs in your browser"
                  index={2}
                />
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center mt-10"
              >
                <a
                  href="https://awaken.tax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Get started with Awaken
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
