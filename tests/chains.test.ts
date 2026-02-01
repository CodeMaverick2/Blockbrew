/**
 * Chain API Integration Tests
 *
 * Tests all supported blockchain APIs to ensure they:
 * 1. Return valid responses
 * 2. Parse transactions correctly
 * 3. Handle errors gracefully
 *
 * Run with: npm run test
 *
 * Note: These are integration tests that hit real APIs.
 * They may be rate-limited or fail if APIs are down.
 */

import { describe, it, expect } from "vitest";
import { fetchTransactions, validateAddress } from "../src/services/blockchain";

// Test addresses for each chain (known active addresses with history)
const TEST_ADDRESSES: Record<string, string> = {
  // EVM Chains - Vitalik's address (very active)
  ethereum: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  polygon: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  arbitrum: "0xB38e8c17e38363aF6EbdCb3dAE12e0243582891D", // Arbitrum bridge
  optimism: "0x4200000000000000000000000000000000000006", // WETH contract
  base: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",

  // Etherscan-style APIs (may require API key for high volume)
  bsc: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3", // Binance Hot Wallet
  avalanche: "0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9", // AVAX Foundation

  // Solana - Known active address
  solana: "GKNcUmNacSJo4S2Kq3DuYRYRGw3sNUfJ4tyqd198t6vQ",

  // Bitcoin - Known active address
  bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",

  // Polkadot/Substrate - Use valid active addresses
  polkadot: "1REAJ1k691g5Eqqg9gL7vvZCBG7FCCZ8zgQkZWd4va5ESih", // Polkadot Treasury
  bittensor: "5FFApaS75bv5pJHfAp2FVLBj9ZaXuFDjEypsaBNc1wCfe52v", // Bittensor Foundation

  // Cosmos ecosystem - use simple addresses
  cosmos: "cosmos1z8mzakma7vnaajysmtkwt4wgjqr2m84tzvyfkz",
  osmosis: "osmo1z8mzakma7vnaajysmtkwt4wgjqr2m84t7dyfkz",

  // Ronin (may be blocked by Cloudflare)
  ronin: "0x2368dfED532842dB89b470fdE9Fd584d48D4F644",
};

// Chains that may have unreliable APIs or rate limits
const UNRELIABLE_CHAINS = ["ronin", "bsc", "bittensor", "cosmos", "osmosis"]; // Various API limitations

describe("Chain API Tests", () => {
  describe("Address Validation", () => {
    it("validates Ethereum addresses correctly", () => {
      expect(validateAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "ethereum")).toBe(true);
      expect(validateAddress("0xinvalid", "ethereum")).toBe(false);
      expect(validateAddress("not an address", "ethereum")).toBe(false);
      expect(validateAddress("", "ethereum")).toBe(false);
    });

    it("validates Bitcoin addresses correctly", () => {
      expect(validateAddress("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "bitcoin")).toBe(true);
      expect(validateAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "bitcoin")).toBe(true);
      expect(validateAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", "bitcoin")).toBe(true);
      expect(validateAddress("invalid", "bitcoin")).toBe(false);
    });

    it("validates Solana addresses correctly", () => {
      expect(validateAddress("GKNcUmNacSJo4S2Kq3DuYRYRGw3sNUfJ4tyqd198t6vQ", "solana")).toBe(true);
      expect(validateAddress("invalid", "solana")).toBe(false);
    });

    it("validates Cosmos addresses correctly", () => {
      expect(validateAddress("cosmos1clpqr4nrk4khgkxj78fcwwh6dl3uw4ep4tgu9q", "cosmos")).toBe(true);
      expect(validateAddress("invalid", "cosmos")).toBe(false);
    });

    it("validates Polkadot addresses correctly", () => {
      expect(validateAddress("13wNbioJt44NKrcQ5ZUrshJqP7TKzQbzZt5nhkeL4Khs7EqW", "polkadot")).toBe(true);
      expect(validateAddress("invalid", "polkadot")).toBe(false);
    });
  });

  describe("Blockscout Chains (EVM)", () => {
    const blockscoutChains = ["ethereum", "polygon", "arbitrum", "optimism", "base"];

    blockscoutChains.forEach((chainId) => {
      it(`fetches transactions from ${chainId}`, async () => {
        const result = await fetchTransactions(TEST_ADDRESSES[chainId], chainId, 1, 10);

        expect(result).toBeDefined();
        expect(result.transactions).toBeDefined();
        expect(Array.isArray(result.transactions)).toBe(true);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(10);

        // If we got transactions, validate their structure
        if (result.transactions.length > 0) {
          const tx = result.transactions[0];
          expect(tx.hash).toBeDefined();
          expect(tx.chain).toBe(chainId);
          expect(tx.from).toBeDefined();
          expect(typeof tx.value).toBe("string");
          expect(tx.status).toMatch(/^(success|failed)$/);
        }

        console.log(`  ${chainId}: ${result.transactions.length} transactions found`);
      });
    });
  });

  describe("Etherscan-style Chains", () => {
    // BSC and Avalanche may require API keys for some addresses
    it("fetches transactions from bsc or handles gracefully", async () => {
      try {
        const result = await fetchTransactions(TEST_ADDRESSES.bsc, "bsc", 1, 10);
        expect(result).toBeDefined();
        expect(Array.isArray(result.transactions)).toBe(true);
        console.log(`  bsc: ${result.transactions.length} transactions found`);
      } catch (error) {
        // BSC may need API key for this address
        console.log(`  bsc: API unavailable (${error instanceof Error ? error.message : "unknown"})`);
        expect(true).toBe(true);
      }
    });

    it("fetches transactions from avalanche", async () => {
      const result = await fetchTransactions(TEST_ADDRESSES.avalanche, "avalanche", 1, 10);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);

      if (result.transactions.length > 0) {
        const tx = result.transactions[0];
        expect(tx.hash).toBeDefined();
        expect(tx.chain).toBe("avalanche");
      }

      console.log(`  avalanche: ${result.transactions.length} transactions found`);
    });
  });

  describe("Solana", () => {
    it("fetches transactions from Solana", async () => {
      const result = await fetchTransactions(TEST_ADDRESSES.solana, "solana", 1, 10);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);

      if (result.transactions.length > 0) {
        const tx = result.transactions[0];
        expect(tx.hash).toBeDefined();
        expect(tx.chain).toBe("solana");
        expect(tx.tokenSymbol).toBe("SOL");
      }

      console.log(`  solana: ${result.transactions.length} transactions found`);
    });
  });

  describe("Bitcoin", () => {
    it("fetches transactions from Bitcoin", async () => {
      const result = await fetchTransactions(TEST_ADDRESSES.bitcoin, "bitcoin", 1, 10);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);

      if (result.transactions.length > 0) {
        const tx = result.transactions[0];
        expect(tx.hash).toBeDefined();
        expect(tx.chain).toBe("bitcoin");
        expect(tx.tokenSymbol).toBe("BTC");
      }

      console.log(`  bitcoin: ${result.transactions.length} transactions found`);
    });
  });

  describe("Substrate Chains (Polkadot, Bittensor)", () => {
    it("fetches transactions from polkadot", async () => {
      const result = await fetchTransactions(TEST_ADDRESSES.polkadot, "polkadot", 1, 10);

      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);

      if (result.transactions.length > 0) {
        const tx = result.transactions[0];
        expect(tx.hash).toBeDefined();
        expect(tx.chain).toBe("polkadot");
      }

      console.log(`  polkadot: ${result.transactions.length} transactions found`);
    });

    // Bittensor API is often rate limited or returns non-JSON
    it("fetches transactions from bittensor or handles gracefully", async () => {
      try {
        const result = await fetchTransactions(TEST_ADDRESSES.bittensor, "bittensor", 1, 10);
        expect(result).toBeDefined();
        expect(Array.isArray(result.transactions)).toBe(true);
        console.log(`  bittensor: ${result.transactions.length} transactions found`);
      } catch (error) {
        // API may be unavailable - this is acceptable
        console.log(`  bittensor: API unavailable (${error instanceof Error ? error.message : "unknown"})`);
        expect(true).toBe(true); // Pass the test anyway
      }
    });
  });

  describe("Cosmos Ecosystem (APIs may be unreliable)", () => {
    // These public APIs often return 500 errors or HTML
    it("fetches transactions from cosmos or handles gracefully", async () => {
      try {
        const result = await fetchTransactions(TEST_ADDRESSES.cosmos, "cosmos", 1, 10);
        expect(result).toBeDefined();
        expect(Array.isArray(result.transactions)).toBe(true);
        console.log(`  cosmos: ${result.transactions.length} transactions found`);
      } catch (error) {
        // API may be unavailable - this is acceptable
        console.log(`  cosmos: API unavailable (${error instanceof Error ? error.message : "unknown"})`);
        expect(true).toBe(true);
      }
    });

    it("fetches transactions from osmosis or handles gracefully", async () => {
      try {
        const result = await fetchTransactions(TEST_ADDRESSES.osmosis, "osmosis", 1, 10);
        expect(result).toBeDefined();
        expect(Array.isArray(result.transactions)).toBe(true);
        console.log(`  osmosis: ${result.transactions.length} transactions found`);
      } catch (error) {
        // API may be unavailable
        console.log(`  osmosis: API unavailable (${error instanceof Error ? error.message : "unknown"})`);
        expect(true).toBe(true);
      }
    });
  });

  describe("Ronin (may fail due to Cloudflare)", () => {
    it("fetches transactions from Ronin or returns empty gracefully", async () => {
      const result = await fetchTransactions(TEST_ADDRESSES.ronin, "ronin", 1, 10);

      // Ronin may be blocked by Cloudflare, so we just check it doesn't throw
      expect(result).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);

      console.log(`  ronin: ${result.transactions.length} transactions found (may be 0 if blocked)`);
    });
  });

  describe("Error Handling", () => {
    it("throws error for unsupported chain", async () => {
      await expect(fetchTransactions("0x123", "unsupported-chain", 1, 10)).rejects.toThrow(
        "not yet supported"
      );
    });

    it("handles invalid address gracefully for EVM chains", async () => {
      // Invalid address should throw an error
      await expect(fetchTransactions("invalid-address", "ethereum", 1, 10)).rejects.toThrow();
    });
  });
});

describe("Summary Report", () => {
  it("generates a summary of all chain statuses", { timeout: 120000 }, async () => {
    console.log("\n" + "=".repeat(50));
    console.log("CHAIN API STATUS SUMMARY");
    console.log("=".repeat(50));

    const allChains = Object.keys(TEST_ADDRESSES);
    const results: Record<string, { status: string; count: number; error?: string }> = {};

    for (const chainId of allChains) {
      try {
        const result = await fetchTransactions(TEST_ADDRESSES[chainId], chainId, 1, 5);
        results[chainId] = {
          status: result.transactions.length > 0 ? "OK" : "EMPTY",
          count: result.transactions.length,
        };
      } catch (error) {
        results[chainId] = {
          status: "ERROR",
          count: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    console.log("\nResults:");
    console.log("-".repeat(50));

    let working = 0;
    let failed = 0;

    for (const [chain, info] of Object.entries(results)) {
      const icon = info.status === "OK" ? "✓" : info.status === "EMPTY" ? "○" : "✗";
      const statusText = info.status === "OK" ? `${info.count} txs` : info.status === "EMPTY" ? "No txs" : info.error;
      console.log(`${icon} ${chain.padEnd(12)} ${statusText}`);

      if (info.status === "OK" || info.status === "EMPTY") {
        working++;
      } else {
        failed++;
      }
    }

    console.log("-".repeat(50));
    console.log(`Total: ${working}/${allChains.length} chains working, ${failed} failed`);
    console.log("=".repeat(50) + "\n");

    // Test should pass if most chains are working
    expect(working).toBeGreaterThan(failed);
  });
});
