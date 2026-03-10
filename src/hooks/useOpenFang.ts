import { useState, useEffect, useCallback } from 'react';

interface OpenFangStatus {
  connected: boolean;
  version: string | null;
  collectorActive: boolean;
  collectorInstanceId: string | null;
  collectorAgentId: string | null;
  metrics: {
    dataPoints: number | null;
    entitiesTracked: number | null;
    reportsGenerated: number | null;
    lastUpdate: string | null;
  };
}

interface HandInstance {
  instance_id: string;
  hand_id: string;
  agent_id: string;
  status: string;
}

interface HandStats {
  metrics: Record<string, { format: string; value: string | number | null }>;
}

const INITIAL_STATUS: OpenFangStatus = {
  connected: false,
  version: null,
  collectorActive: false,
  collectorInstanceId: null,
  collectorAgentId: null,
  metrics: {
    dataPoints: null,
    entitiesTracked: null,
    reportsGenerated: null,
    lastUpdate: null,
  },
};

export function useOpenFang(pollInterval = 30_000) {
  const [status, setStatus] = useState<OpenFangStatus>(INITIAL_STATUS);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      // Health check
      const healthRes = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
      if (!healthRes.ok) throw new Error('OpenFang API not reachable');
      const health = await healthRes.json();

      // Get active hands
      const handsRes = await fetch('/api/hands/active');
      const hands: HandInstance[] = await handsRes.json();
      const collector = hands.find((h: HandInstance) => h.hand_id === 'collector');

      if (!collector) {
        setStatus({
          connected: true,
          version: health.version,
          collectorActive: false,
          collectorInstanceId: null,
          collectorAgentId: null,
          metrics: INITIAL_STATUS.metrics,
        });
        setError(null);
        return;
      }

      // Get collector stats
      let metrics = INITIAL_STATUS.metrics;
      try {
        const statsRes = await fetch(`/api/hands/instances/${collector.instance_id}/stats`);
        const stats: HandStats = await statsRes.json();
        metrics = {
          dataPoints: stats.metrics['Data Points']?.value as number | null,
          entitiesTracked: stats.metrics['Entities Tracked']?.value as number | null,
          reportsGenerated: stats.metrics['Reports Generated']?.value as number | null,
          lastUpdate: stats.metrics['Last Update']?.value as string | null,
        };
      } catch {
        // Stats might not be available yet
      }

      setStatus({
        connected: true,
        version: health.version,
        collectorActive: collector.status === 'Active',
        collectorInstanceId: collector.instance_id,
        collectorAgentId: collector.agent_id,
        metrics,
      });
      setError(null);
    } catch {
      setStatus(INITIAL_STATUS);
      setError('OpenFang not reachable');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval]);

  return { status, error, refresh: fetchStatus };
}
