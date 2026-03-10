import { useState, useEffect, useCallback } from 'react';
import type { Repo } from '../data';
import { SEED_REPOS } from '../data';
import {
  fetchTrendingAIRepos,
  getCachedRepos,
  setCachedRepos,
  getCacheTimestamp,
  RateLimitError,
} from '../api';

interface UseReposResult {
  repos: Repo[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  isFromCache: boolean;
  isFromSeed: boolean;
}

/**
 * Merges API repos with seed data. API repos take priority (matched by fullName),
 * and any seed repos not found in the API results are appended.
 */
function mergeWithSeedData(apiRepos: Repo[]): Repo[] {
  const apiFullNames = new Set(apiRepos.map((r) => r.fullName.toLowerCase()));
  const seedOnly = SEED_REPOS.filter(
    (r) => !apiFullNames.has(r.fullName.toLowerCase())
  );
  return [...apiRepos, ...seedOnly];
}

export function useRepos(): UseReposResult {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isFromSeed, setIsFromSeed] = useState(false);

  const load = useCallback(async (skipCache = false) => {
    setLoading(true);
    setError(null);

    // 1. Try cache first
    if (!skipCache) {
      const cached = getCachedRepos();
      if (cached && cached.length > 0) {
        const ts = getCacheTimestamp();
        setRepos(mergeWithSeedData(cached));
        setLastUpdated(ts ? new Date(ts) : null);
        setIsFromCache(true);
        setIsFromSeed(false);
        setLoading(false);
        return;
      }
    }

    // 2. Fetch from API
    try {
      const apiRepos = await fetchTrendingAIRepos();
      const merged = mergeWithSeedData(apiRepos);
      setCachedRepos(apiRepos);
      setRepos(merged);
      setLastUpdated(new Date());
      setIsFromCache(false);
      setIsFromSeed(false);
    } catch (err) {
      const message =
        err instanceof RateLimitError
          ? 'GitHub API rate limit reached. Showing cached/seed data.'
          : err instanceof Error
            ? err.message
            : 'Failed to fetch repos';
      setError(message);

      // 3. Fallback: try cache even if expired, then seed data
      const cached = getCachedRepos();
      if (cached && cached.length > 0) {
        setRepos(mergeWithSeedData(cached));
        setIsFromCache(true);
        setIsFromSeed(false);
      } else {
        setRepos(SEED_REPOS);
        setIsFromSeed(true);
        setIsFromCache(false);
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

  return { repos, loading, error, lastUpdated, refresh, isFromCache, isFromSeed };
}
