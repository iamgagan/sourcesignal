import { useState, useEffect, useCallback } from 'react';
import type { Repo } from '../data';
import { fetchRecentlyTrending, RateLimitError } from '../api';

const TRENDING_CACHE_KEY = 'sourcesignal_trending_cache';
const TRENDING_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  repos: Repo[];
  timestamp: number;
}

function getCachedTrending(): { repos: Repo[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(TRENDING_CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > TRENDING_CACHE_TTL) {
      localStorage.removeItem(TRENDING_CACHE_KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function setCachedTrending(repos: Repo[]): void {
  try {
    const entry: CacheEntry = { repos, timestamp: Date.now() };
    localStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // silently ignore
  }
}

interface UseGitHubTrendingResult {
  repos: Repo[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

/**
 * Hook that fetches recently trending AI/ML repos from GitHub search API.
 * Filters by repos pushed in the last 7 days and sorted by stars.
 * Results are cached in localStorage for 30 minutes.
 */
export function useGitHubTrending(): UseGitHubTrendingResult {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (skipCache = false) => {
    setLoading(true);
    setError(null);

    // Check cache first
    if (!skipCache) {
      const cached = getCachedTrending();
      if (cached) {
        setRepos(cached.repos);
        setLastUpdated(new Date(cached.timestamp));
        setLoading(false);
        return;
      }
    }

    try {
      const trendingRepos = await fetchRecentlyTrending();
      setCachedTrending(trendingRepos);
      setRepos(trendingRepos);
      setLastUpdated(new Date());
    } catch (err) {
      const message =
        err instanceof RateLimitError
          ? 'GitHub API rate limit reached.'
          : err instanceof Error
            ? err.message
            : 'Failed to fetch trending repos';
      setError(message);

      // Try expired cache as fallback
      const cached = getCachedTrending();
      if (cached) {
        setRepos(cached.repos);
        setLastUpdated(new Date(cached.timestamp));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => {
    load(true);
  }, [load]);

  return { repos, loading, error, lastUpdated, refresh };
}
