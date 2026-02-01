"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { SavedAddress, AddressMemoryState } from "@/types";

const STORAGE_KEY = "blockbrew-address-memory";
const MAX_RECENT_ADDRESSES = 10;

const initialState: AddressMemoryState = {
  recentAddresses: [],
  bookmarkedAddresses: [],
};

export function useAddressMemory() {
  const [state, setState] = useLocalStorage<AddressMemoryState>(
    STORAGE_KEY,
    initialState
  );

  // Add or update a recent address
  const addRecentAddress = useCallback(
    (address: string, chainId: string) => {
      setState((prev) => {
        const normalizedAddress = address.toLowerCase();
        const existingIndex = prev.recentAddresses.findIndex(
          (a) => a.address.toLowerCase() === normalizedAddress && a.chainId === chainId
        );

        let updatedRecent: SavedAddress[];

        if (existingIndex >= 0) {
          // Update existing address
          const existing = prev.recentAddresses[existingIndex];
          updatedRecent = [
            {
              ...existing,
              lastSearched: Date.now(),
              searchCount: existing.searchCount + 1,
            },
            ...prev.recentAddresses.slice(0, existingIndex),
            ...prev.recentAddresses.slice(existingIndex + 1),
          ];
        } else {
          // Add new address
          updatedRecent = [
            {
              address,
              chainId,
              isBookmarked: false,
              lastSearched: Date.now(),
              searchCount: 1,
            },
            ...prev.recentAddresses,
          ].slice(0, MAX_RECENT_ADDRESSES);
        }

        return {
          ...prev,
          recentAddresses: updatedRecent,
        };
      });
    },
    [setState]
  );

  // Toggle bookmark status for an address
  const toggleBookmark = useCallback(
    (address: string, chainId: string, label?: string) => {
      setState((prev) => {
        const normalizedAddress = address.toLowerCase();
        const isCurrentlyBookmarked = prev.bookmarkedAddresses.some(
          (a) => a.address.toLowerCase() === normalizedAddress && a.chainId === chainId
        );

        if (isCurrentlyBookmarked) {
          // Remove from bookmarks
          return {
            ...prev,
            bookmarkedAddresses: prev.bookmarkedAddresses.filter(
              (a) => !(a.address.toLowerCase() === normalizedAddress && a.chainId === chainId)
            ),
            recentAddresses: prev.recentAddresses.map((a) =>
              a.address.toLowerCase() === normalizedAddress && a.chainId === chainId
                ? { ...a, isBookmarked: false }
                : a
            ),
          };
        } else {
          // Add to bookmarks
          const existingRecent = prev.recentAddresses.find(
            (a) => a.address.toLowerCase() === normalizedAddress && a.chainId === chainId
          );

          const newBookmark: SavedAddress = existingRecent
            ? { ...existingRecent, isBookmarked: true, label }
            : {
                address,
                chainId,
                label,
                isBookmarked: true,
                lastSearched: Date.now(),
                searchCount: 0,
              };

          return {
            ...prev,
            bookmarkedAddresses: [newBookmark, ...prev.bookmarkedAddresses],
            recentAddresses: prev.recentAddresses.map((a) =>
              a.address.toLowerCase() === normalizedAddress && a.chainId === chainId
                ? { ...a, isBookmarked: true, label }
                : a
            ),
          };
        }
      });
    },
    [setState]
  );

  // Update label for a bookmarked address
  const updateLabel = useCallback(
    (address: string, chainId: string, label: string) => {
      setState((prev) => ({
        ...prev,
        bookmarkedAddresses: prev.bookmarkedAddresses.map((a) =>
          a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId
            ? { ...a, label }
            : a
        ),
        recentAddresses: prev.recentAddresses.map((a) =>
          a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId
            ? { ...a, label }
            : a
        ),
      }));
    },
    [setState]
  );

  // Remove a recent address
  const removeRecentAddress = useCallback(
    (address: string, chainId: string) => {
      setState((prev) => ({
        ...prev,
        recentAddresses: prev.recentAddresses.filter(
          (a) => !(a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId)
        ),
      }));
    },
    [setState]
  );

  // Remove a bookmarked address
  const removeBookmark = useCallback(
    (address: string, chainId: string) => {
      setState((prev) => ({
        ...prev,
        bookmarkedAddresses: prev.bookmarkedAddresses.filter(
          (a) => !(a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId)
        ),
        recentAddresses: prev.recentAddresses.map((a) =>
          a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId
            ? { ...a, isBookmarked: false, label: undefined }
            : a
        ),
      }));
    },
    [setState]
  );

  // Clear all recent addresses
  const clearRecentAddresses = useCallback(() => {
    setState((prev) => ({
      ...prev,
      recentAddresses: prev.recentAddresses.filter((a) => a.isBookmarked),
    }));
  }, [setState]);

  // Check if an address is bookmarked
  const isBookmarked = useCallback(
    (address: string, chainId: string) => {
      return state.bookmarkedAddresses.some(
        (a) => a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId
      );
    },
    [state.bookmarkedAddresses]
  );

  // Deduplicate recent addresses (in case of corrupted localStorage)
  const deduplicatedRecent = useMemo(() => {
    const seen = new Set<string>();
    return state.recentAddresses.filter((a) => {
      const key = `${a.address.toLowerCase()}-${a.chainId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [state.recentAddresses]);

  // Get all addresses (bookmarks first, then recent)
  const allAddresses = useMemo(() => {
    const bookmarkedSet = new Set(
      state.bookmarkedAddresses.map((a) => `${a.address.toLowerCase()}-${a.chainId}`)
    );

    const nonBookmarkedRecent = deduplicatedRecent.filter(
      (a) => !bookmarkedSet.has(`${a.address.toLowerCase()}-${a.chainId}`)
    );

    return [...state.bookmarkedAddresses, ...nonBookmarkedRecent];
  }, [state.bookmarkedAddresses, deduplicatedRecent]);

  return {
    recentAddresses: deduplicatedRecent,
    bookmarkedAddresses: state.bookmarkedAddresses,
    allAddresses,
    addRecentAddress,
    toggleBookmark,
    updateLabel,
    removeRecentAddress,
    removeBookmark,
    clearRecentAddresses,
    isBookmarked,
  };
}
