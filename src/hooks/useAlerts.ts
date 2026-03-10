import { useState, useEffect, useCallback } from 'react';
import type { Repo } from '../data';

export interface Alert {
  id: string;
  repoFullName: string;
  milestone: number;
  stars: number;
  timestamp: number;
  seen: boolean;
}

const MILESTONES = [500, 1_000, 2_000, 5_000, 10_000, 25_000, 50_000, 100_000, 200_000];
const STORAGE_KEY = 'sourcesignal_alerts';
const SEEN_STARS_KEY = 'sourcesignal_seen_stars';

function loadAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  try {
    // Keep only last 50 alerts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)));
  } catch {
    // localStorage full
  }
}

function loadSeenStars(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_STARS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSeenStars(seen: Record<string, number>) {
  try {
    localStorage.setItem(SEEN_STARS_KEY, JSON.stringify(seen));
  } catch {
    // localStorage full
  }
}

export function useAlerts(repos: Repo[]) {
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts);
  const unseenCount = alerts.filter(a => !a.seen).length;

  // Check for new milestone crossings when repos change
  useEffect(() => {
    if (repos.length === 0) return;

    const seenStars = loadSeenStars();
    const newAlerts: Alert[] = [];

    for (const repo of repos) {
      const previousStars = seenStars[repo.fullName];

      if (previousStars !== undefined) {
        // Check if any milestone was crossed
        for (const milestone of MILESTONES) {
          if (previousStars < milestone && repo.stars >= milestone) {
            newAlerts.push({
              id: `${repo.fullName}-${milestone}-${Date.now()}`,
              repoFullName: repo.fullName,
              milestone,
              stars: repo.stars,
              timestamp: Date.now(),
              seen: false,
            });
          }
        }
      }

      // Update seen stars
      seenStars[repo.fullName] = repo.stars;
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const updated = [...newAlerts, ...prev];
        saveAlerts(updated);
        return updated;
      });
    }

    saveSeenStars(seenStars);
  }, [repos]);

  const markAllSeen = useCallback(() => {
    setAlerts(prev => {
      const updated = prev.map(a => ({ ...a, seen: true }));
      saveAlerts(updated);
      return updated;
    });
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    saveAlerts([]);
  }, []);

  return { alerts, unseenCount, markAllSeen, clearAlerts };
}

export function formatMilestone(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 0)}K`;
  return n.toString();
}
