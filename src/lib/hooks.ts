"use client";

/* Small data-fetching primitives. Deliberately dependency-free so they can be
 * swapped for React Query later without touching the API layer. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ListQuery, Paginated } from "@/types";

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  setData: (updater: T | ((prev: T | null) => T)) => void;
}

/** Runs `fetcher` on mount and whenever a value in `deps` changes. */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify([deps, nonce]);

  // The result carries the key it was fetched for, so `loading` is derived
  // rather than toggled from inside the effect.
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null }>({
    key: "",
    data: null,
    error: null,
  });

  const fetcherRef = useRef(fetcher);

  // Declared first so the ref holds the latest fetcher before the fetch effect runs.
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({ key, data: null, error: err instanceof Error ? err.message : "Request failed" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    setResult((prev) => ({
      ...prev,
      data: typeof updater === "function" ? (updater as (p: T | null) => T)(prev.data) : updater,
    }));
  }, []);

  return {
    data: result.data,
    loading: result.key !== key,
    error: result.error,
    refresh: () => setNonce((n) => n + 1),
    setData,
  };
}

export interface ListState<T> extends QueryState<Paginated<T>> {
  query: ListQuery;
  setQuery: (patch: Partial<ListQuery>) => void;
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/** List screens: keeps search / filters / paging state and refetches on change. */
export function useList<T>(
  fetcher: (q: ListQuery) => Promise<Paginated<T>>,
  initial: ListQuery = {},
): ListState<T> {
  const [query, setQueryState] = useState<ListQuery>({
    page: 1,
    perPage: 10,
    search: "",
    status: "all",
    type: "all",
    sort: "-updatedAt",
    ...initial,
  });

  const setQuery = useCallback((patch: Partial<ListQuery>) => {
    setQueryState((prev) => ({
      ...prev,
      ...patch,
      // any filter change resets paging, unless the page itself moved
      page: patch.page ?? 1,
    }));
  }, []);

  const key = JSON.stringify(query);
  const state = useQuery<Paginated<T>>(() => fetcher(query), [key]);

  const items = useMemo(() => state.data?.items ?? [], [state.data]);
  const total = state.data?.total ?? 0;
  const perPage = query.perPage ?? 10;

  return {
    ...state,
    query,
    setQuery,
    items,
    total,
    page: query.page ?? 1,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export interface MutationState<A extends unknown[], R> {
  run: (...args: A) => Promise<R | null>;
  pending: boolean;
  error: string | null;
}

/** Wraps a write call with pending/error state. */
export function useMutation<A extends unknown[], R>(
  action: (...args: A) => Promise<R>,
): MutationState<A, R> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionRef = useRef(action);
  useEffect(() => {
    actionRef.current = action;
  });

  const run = useCallback(async (...args: A) => {
    setPending(true);
    setError(null);
    try {
      return await actionRef.current(...args);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  return { run, pending, error };
}

/** Debounces a value — used by the list search boxes. */
export function useDebounced<T>(value: T, ms = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Closes dropdowns / popovers when clicking outside of `ref`. */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutside: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside, active]);
}
