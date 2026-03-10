import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search, Star, GitFork, ArrowUp, ArrowDown,
  RefreshCw, Loader2, LayoutGrid, List, TrendingUp,
  Activity, Clock, Flame, ExternalLink, Bell,
  FileText, Radio, X, Check, Command, Zap, Gem, Mountain, Rocket,
  Code2, ChevronRight,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, type Repo, type Category } from './data';
import { useRepos } from './hooks/useRepos';
import { useOpenFang } from './hooks/useOpenFang';
import { useAlerts, formatMilestone } from './hooks/useAlerts';

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a',
  Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', Java: '#b07219',
  Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
  'Jupyter Notebook': '#DA5B0B', C: '#555555', Shell: '#89e051',
};

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

function generateSparkData(stars: number, delta: number): number[] {
  const pts: number[] = [];
  const base = stars - delta;
  for (let i = 0; i < 14; i++) {
    const p = i / 13;
    pts.push(Math.round(base + delta * (p * p * 0.3 + p * 0.7) + Math.sin(i * 1.2 + delta % 7) * delta * 0.08));
  }
  return pts;
}

/* ── Sparkline ── */
function SparkLine({ data, color, size = 'sm' }: { data: number[]; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? { w: 160, h: 48 } : size === 'md' ? { w: 100, h: 32 } : { w: 64, h: 22 };
  const gradId = `grad-${color.replace('#', '')}-${size}`;
  return (
    <div style={{ width: dims.w, height: dims.h }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((v, i) => ({ v, i }))}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={size === 'lg' ? 2 : 1.5} fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Velocity Badge ── */
function VelocityBadge({ delta }: { delta: number }) {
  const tier = delta > 2000 ? 'extreme' : delta > 1000 ? 'high' : delta > 500 ? 'warm' : 'normal';
  const styles = {
    extreme: 'text-signal-green bg-signal-green/10 border-signal-green/20',
    high: 'text-signal-green bg-signal-green/8 border-signal-green/15',
    warm: 'text-signal-amber bg-signal-amber/8 border-signal-amber/15',
    normal: 'text-dim bg-overlay border-border',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium px-1.5 py-0.5 rounded border ${styles[tier]}`}>
      {tier === 'extreme' && <Flame className="w-3 h-3" />}
      <ArrowUp className="w-3 h-3" />
      {formatNum(delta)}/w
    </span>
  );
}

/* ── Featured Card ── */
function FeaturedCard({ repo, rank }: { repo: Repo; rank: number }) {
  const color = CATEGORY_COLORS[repo.category];
  const langColor = LANG_COLORS[repo.language] || '#5a6a88';
  const sparkData = useMemo(() => generateSparkData(repo.stars, repo.starsWeekDelta), [repo.stars, repo.starsWeekDelta]);

  return (
    <a href={repo.url} target="_blank" rel="noopener noreferrer"
      className="featured-card glow-border group block rounded-lg bg-raised/80 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}08, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-muted font-medium">#{rank}</span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-subtle uppercase tracking-wider truncate">{repo.category}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
        <h3 className="text-sm font-semibold text-bright group-hover:text-accent-bright transition-colors truncate mb-1">{repo.fullName}</h3>
        <p className="text-xs text-subtle line-clamp-2 mb-3 leading-relaxed">{repo.description}</p>
        <div className="mb-3"><SparkLine data={sparkData} color={color} size="lg" /></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-mono text-dim">
            <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-signal-amber" />{formatNum(repo.stars)}</span>
            <span className="inline-flex items-center gap-1"><GitFork className="w-3 h-3" />{formatNum(repo.forks)}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />{repo.language}
            </span>
          </div>
          <VelocityBadge delta={repo.starsWeekDelta} />
        </div>
      </div>
    </a>
  );
}

/* ── Table Row ── */
function RepoRow({ repo, rank }: { repo: Repo; rank: number }) {
  const langColor = LANG_COLORS[repo.language] || '#5a6a88';
  const catColor = CATEGORY_COLORS[repo.category];
  const sparkData = useMemo(() => generateSparkData(repo.stars, repo.starsWeekDelta), [repo.stars, repo.starsWeekDelta]);

  return (
    <a href={repo.url} target="_blank" rel="noopener noreferrer"
      className="repo-row group flex items-center gap-3 px-4 py-3 border-b border-border/60">
      <span className="w-7 text-xs font-mono text-muted text-right shrink-0 tabular-nums">{rank}</span>
      <span className="w-2 h-2 rounded-full shrink-0 opacity-60" style={{ backgroundColor: catColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary group-hover:text-accent-bright transition-colors truncate">{repo.fullName}</span>
          {repo.trending && (
            <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-signal-amber font-medium">
              <Flame className="w-2.5 h-2.5 animate-pulse-glow" />HOT
            </span>
          )}
        </div>
        <p className="text-xs text-subtle truncate mt-0.5">{repo.description}</p>
      </div>
      <SparkLine data={sparkData} color={catColor} size="sm" />
      <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-dim tabular-nums">
        <span className="inline-flex items-center gap-1 w-16 justify-end"><Star className="w-3 h-3 text-signal-amber/60" />{formatNum(repo.stars)}</span>
        <span className={`inline-flex items-center gap-0.5 w-16 justify-end font-medium ${repo.starsWeekDelta > 1000 ? 'text-signal-green' : repo.starsWeekDelta > 500 ? 'text-signal-amber' : ''}`}>
          <ArrowUp className="w-3 h-3" />{formatNum(repo.starsWeekDelta)}
        </span>
        <span className="inline-flex items-center gap-1 w-14 justify-end"><GitFork className="w-3 h-3" />{formatNum(repo.forks)}</span>
        <span className="inline-flex items-center gap-1.5 w-24">
          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: langColor }} />
          <span className="truncate">{repo.language}</span>
        </span>
        <span className="inline-flex items-center gap-1 w-14 justify-end text-subtle"><Clock className="w-3 h-3" />{repo.lastCommit}</span>
      </div>
    </a>
  );
}

/* ── Grid Card ── */
function RepoCard({ repo }: { repo: Repo }) {
  const langColor = LANG_COLORS[repo.language] || '#5a6a88';
  const color = CATEGORY_COLORS[repo.category];
  const sparkData = useMemo(() => generateSparkData(repo.stars, repo.starsWeekDelta), [repo.stars, repo.starsWeekDelta]);

  return (
    <a href={repo.url} target="_blank" rel="noopener noreferrer"
      className="featured-card group block border border-border rounded-lg p-3.5 bg-raised/40 hover:bg-raised/80 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] opacity-40" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-center gap-2 mb-1.5 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-primary group-hover:text-accent-bright truncate transition-colors">{repo.fullName}</span>
        {repo.trending && <Flame className="w-3 h-3 text-signal-amber shrink-0 animate-pulse-glow" />}
      </div>
      <p className="text-xs text-subtle mb-3 line-clamp-2 leading-relaxed">{repo.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs font-mono text-dim tabular-nums">
          <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-signal-amber/60" />{formatNum(repo.stars)}</span>
          <span className={`inline-flex items-center gap-0.5 font-medium ${repo.starsWeekDelta > 1000 ? 'text-signal-green' : repo.starsWeekDelta > 500 ? 'text-signal-amber' : ''}`}>
            <ArrowUp className="w-3 h-3" />{formatNum(repo.starsWeekDelta)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />{repo.language}
          </span>
        </div>
        <SparkLine data={sparkData} color={color} size="sm" />
      </div>
    </a>
  );
}

/* ── Weekly Digest View ── */
function DigestView({ repos }: { repos: Repo[] }) {
  const categoryGroups = useMemo(() => {
    const groups: Record<string, Repo[]> = {};
    for (const repo of repos) {
      if (!groups[repo.category]) groups[repo.category] = [];
      groups[repo.category].push(repo);
    }
    // Sort each group by velocity
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => b.starsWeekDelta - a.starsWeekDelta);
    }
    // Sort categories by total velocity
    return Object.entries(groups).sort(
      ([, a], [, b]) => b.reduce((s, r) => s + r.starsWeekDelta, 0) - a.reduce((s, r) => s + r.starsWeekDelta, 0)
    );
  }, [repos]);

  const topMovers = useMemo(() =>
    [...repos].sort((a, b) => b.starsWeekDelta - a.starsWeekDelta).slice(0, 5),
    [repos]
  );

  const topByStars = useMemo(() =>
    [...repos].sort((a, b) => b.stars - a.stars).slice(0, 5),
    [repos]
  );

  const newlyTrending = useMemo(() =>
    repos.filter(r => r.trending).sort((a, b) => b.starsWeekDelta - a.starsWeekDelta).slice(0, 10),
    [repos]
  );

  const totalVelocity = repos.reduce((s, r) => s + r.starsWeekDelta, 0);
  const avgVelocity = repos.length > 0 ? Math.round(totalVelocity / repos.length) : 0;
  const hotRepos = repos.filter(r => r.starsWeekDelta > 1000).length;
  const topLanguages = useMemo(() => {
    const langCounts: Record<string, number> = {};
    for (const r of repos) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    return Object.entries(langCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [repos]);

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Digest Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-bright">Weekly Signal Digest</h2>
        </div>
        <p className="text-sm text-subtle font-mono">{dateRange}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Repos', value: repos.length.toString(), sub: 'tracked' },
          { label: 'Combined Velocity', value: `+${formatNum(totalVelocity)}`, sub: 'stars/week', color: 'text-signal-green' },
          { label: 'Hot Repos', value: hotRepos.toString(), sub: '>1K stars/week', color: 'text-signal-amber' },
          { label: 'Avg Velocity', value: `+${formatNum(avgVelocity)}`, sub: 'stars/week' },
        ].map(stat => (
          <div key={stat.label} className="bg-raised/60 border border-border rounded-lg p-3">
            <p className="text-[10px] text-subtle uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-xl font-bold font-mono tabular-nums ${stat.color || 'text-bright'}`}>{stat.value}</p>
            <p className="text-[10px] text-muted">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Top Movers */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-dim uppercase tracking-wider mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-signal-amber" />
          Biggest Movers
        </h3>
        <div className="space-y-2">
          {topMovers.map((repo, i) => {
            const color = CATEGORY_COLORS[repo.category];
            return (
              <a key={repo.id} href={repo.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-raised/40 border border-border rounded-lg hover:bg-raised/80 transition-colors group">
                <span className="text-lg font-bold font-mono text-muted w-8 text-right">{i + 1}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-primary group-hover:text-accent-bright transition-colors">{repo.fullName}</span>
                  <p className="text-xs text-subtle truncate">{repo.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-mono text-signal-green">+{formatNum(repo.starsWeekDelta)}</p>
                  <p className="text-[10px] text-muted font-mono">{formatNum(repo.stars)} total</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Top Languages */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-dim uppercase tracking-wider mb-3">Language Distribution</h3>
        <div className="flex gap-2 flex-wrap">
          {topLanguages.map(([lang, count]) => (
            <div key={lang} className="flex items-center gap-2 bg-raised/60 border border-border rounded-lg px-3 py-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LANG_COLORS[lang] || '#5a6a88' }} />
              <span className="text-sm text-primary">{lang}</span>
              <span className="text-xs font-mono text-muted">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Now */}
      {newlyTrending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-dim uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Trending Now
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {newlyTrending.map(repo => {
              const color = CATEGORY_COLORS[repo.category];
              return (
                <a key={repo.id} href={repo.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 bg-raised/30 border border-border/60 rounded-lg hover:bg-raised/60 transition-colors group">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-primary group-hover:text-accent-bright truncate">{repo.fullName}</span>
                  <span className="text-xs font-mono text-signal-green ml-auto shrink-0">+{formatNum(repo.starsWeekDelta)}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-dim uppercase tracking-wider mb-3">Category Breakdown</h3>
        <div className="space-y-4">
          {categoryGroups.map(([category, catRepos]) => {
            const color = CATEGORY_COLORS[category as Category];
            const catVelocity = catRepos.reduce((s, r) => s + r.starsWeekDelta, 0);
            const topRepo = catRepos[0];
            return (
              <div key={category} className="border border-border/60 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-raised/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-primary">{category}</span>
                    <span className="text-xs font-mono text-muted">{catRepos.length} repos</span>
                  </div>
                  <span className="text-xs font-mono text-signal-green">+{formatNum(catVelocity)}/w</span>
                </div>
                <div className="p-3 text-xs text-subtle">
                  <p>
                    Top performer: <a href={topRepo.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{topRepo.fullName}</a>
                    {' '}with +{formatNum(topRepo.starsWeekDelta)} stars this week ({formatNum(topRepo.stars)} total).
                    {catRepos.length > 1 && ` ${catRepos.filter(r => r.trending).length} of ${catRepos.length} repos trending.`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Most Starred */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-dim uppercase tracking-wider mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-signal-amber" />
          Most Starred Overall
        </h3>
        <div className="space-y-1">
          {topByStars.map((repo, i) => (
            <a key={repo.id} href={repo.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-raised/40 transition-colors group">
              <span className="text-xs font-mono text-muted w-5 text-right">{i + 1}</span>
              <span className="text-sm text-primary group-hover:text-accent-bright">{repo.fullName}</span>
              <span className="text-xs font-mono text-signal-amber ml-auto">{formatNum(repo.stars)}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Alert Panel ── */
function AlertPanel({ alerts, onMarkSeen, onClear, onClose }: {
  alerts: ReturnType<typeof useAlerts>['alerts'];
  onMarkSeen: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-raised border border-border rounded-lg shadow-2xl shadow-void/50 z-50 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-sm font-semibold text-bright">Alerts</span>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <>
              <button onClick={onMarkSeen} className="text-[10px] text-accent hover:underline cursor-pointer">Mark all read</button>
              <button onClick={onClear} className="text-[10px] text-subtle hover:text-signal-red cursor-pointer">Clear</button>
            </>
          )}
          <button onClick={onClose} className="p-0.5 hover:bg-overlay rounded cursor-pointer">
            <X className="w-3.5 h-3.5 text-subtle" />
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-6 h-6 text-muted mx-auto mb-2" />
            <p className="text-xs text-subtle">No alerts yet</p>
            <p className="text-[10px] text-muted mt-1">Milestone alerts appear when repos cross 1K, 5K, 10K, 50K, 100K stars</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 px-3 py-2.5 border-b border-border/40 ${!alert.seen ? 'bg-accent/5' : ''}`}>
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!alert.seen ? 'bg-accent' : 'bg-muted'}`} />
              <div className="min-w-0">
                <p className="text-xs text-primary">
                  <span className="font-medium">{alert.repoFullName}</span>
                  {' '}crossed{' '}
                  <span className="font-mono font-bold text-signal-green">{formatMilestone(alert.milestone)}</span>
                  {' '}stars
                </p>
                <p className="text-[10px] text-muted font-mono mt-0.5">
                  {formatNum(alert.stars)} total &middot; {new Date(alert.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Smart Collections ── */
interface SmartCollection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  filter: (repos: Repo[]) => Repo[];
}

const SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'rising',
    label: 'Rising Stars',
    description: 'New repos with explosive growth',
    icon: <Zap className="w-4 h-4" />,
    color: '#fbbf24',
    filter: (repos) => repos
      .filter(r => r.stars < 30000 && r.starsWeekDelta > 500)
      .sort((a, b) => b.starsWeekDelta - a.starsWeekDelta),
  },
  {
    id: 'gems',
    label: 'Hidden Gems',
    description: 'Under the radar but growing fast',
    icon: <Gem className="w-4 h-4" />,
    color: '#a78bfa',
    filter: (repos) => repos
      .filter(r => r.stars < 15000 && r.starsWeekDelta > 200)
      .sort((a, b) => (b.starsWeekDelta / b.stars) - (a.starsWeekDelta / a.stars)),
  },
  {
    id: 'giants',
    label: 'Established Giants',
    description: 'Battle-tested with 50K+ stars',
    icon: <Mountain className="w-4 h-4" />,
    color: '#38bdf8',
    filter: (repos) => repos
      .filter(r => r.stars >= 50000)
      .sort((a, b) => b.stars - a.stars),
  },
  {
    id: 'hot',
    label: 'On Fire',
    description: 'Fastest velocity right now',
    icon: <Flame className="w-4 h-4" />,
    color: '#f87171',
    filter: (repos) => repos
      .filter(r => r.starsWeekDelta > 1000)
      .sort((a, b) => b.starsWeekDelta - a.starsWeekDelta),
  },
];

function SmartCollections({ repos, activeCollection, onSelect }: {
  repos: Repo[];
  activeCollection: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-4 h-4 text-accent" />
        <h2 className="text-xs font-bold text-dim uppercase tracking-wider">Quick Collections</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SMART_COLLECTIONS.map(col => {
          const matches = col.filter(repos);
          const isActive = activeCollection === col.id;
          if (matches.length === 0) return null;
          return (
            <button
              key={col.id}
              onClick={() => onSelect(isActive ? null : col.id)}
              className={`group text-left p-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-raised border-accent/30 shadow-lg shadow-accent/5'
                  : 'bg-raised/40 border-border hover:bg-raised/80 hover:border-border-bright'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`transition-colors ${isActive ? 'text-accent' : 'text-muted group-hover:text-primary'}`}
                  style={isActive ? {} : { color: col.color }}>
                  {col.icon}
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-accent' : 'text-primary'}`}>{col.label}</span>
              </div>
              <p className="text-[10px] text-subtle mb-2 leading-relaxed">{col.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted tabular-nums">{matches.length} repos</span>
                {matches[0] && (
                  <span className="text-[10px] font-mono text-signal-green">+{formatNum(matches[0].starsWeekDelta)}/w</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Command Palette ── */
type PaletteResult =
  | { type: 'repo'; repo: Repo }
  | { type: 'category'; category: Category; count: number }
  | { type: 'language'; language: string; count: number; color: string }
  | { type: 'collection'; collection: SmartCollection; count: number };

function CommandPalette({ repos, open, onClose, onSelectRepo, onSelectCategory, onSelectCollection }: {
  repos: Repo[];
  open: boolean;
  onClose: () => void;
  onSelectRepo: (url: string) => void;
  onSelectCategory: (cat: Category) => void;
  onSelectCollection: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo((): PaletteResult[] => {
    const q = query.toLowerCase().trim();
    const items: PaletteResult[] = [];

    // Collections
    for (const col of SMART_COLLECTIONS) {
      const matches = col.filter(repos);
      if (matches.length > 0 && (!q || col.label.toLowerCase().includes(q) || col.description.toLowerCase().includes(q))) {
        items.push({ type: 'collection', collection: col, count: matches.length });
      }
    }

    // Categories
    const catCounts: Partial<Record<Category, number>> = {};
    for (const r of repos) catCounts[r.category] = (catCounts[r.category] || 0) + 1;
    for (const cat of CATEGORIES) {
      if (catCounts[cat] && (!q || cat.toLowerCase().includes(q))) {
        items.push({ type: 'category', category: cat, count: catCounts[cat]! });
      }
    }

    // Languages
    const langCounts: Record<string, number> = {};
    for (const r of repos) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    const sortedLangs = Object.entries(langCounts).sort(([, a], [, b]) => b - a);
    for (const [lang, count] of sortedLangs) {
      if (!q || lang.toLowerCase().includes(q)) {
        items.push({ type: 'language', language: lang, count, color: LANG_COLORS[lang] || '#5a6a88' });
      }
    }

    // Repos — fuzzy match
    const repoResults = repos.filter(r =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.language.toLowerCase().includes(q)
    ).sort((a, b) => b.starsWeekDelta - a.starsWeekDelta);

    for (const repo of repoResults.slice(0, q ? 10 : 5)) {
      items.push({ type: 'repo', repo });
    }

    return items;
  }, [repos, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((result: PaletteResult) => {
    switch (result.type) {
      case 'repo':
        onSelectRepo(result.repo.url);
        break;
      case 'category':
        onSelectCategory(result.category);
        break;
      case 'collection':
        onSelectCollection(result.collection.id);
        break;
      case 'language':
        // Navigate to search with language filter
        onClose();
        break;
    }
    onClose();
  }, [onClose, onSelectRepo, onSelectCategory, onSelectCollection]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIndex, handleSelect, onClose]);

  if (!open) return null;

  const sectionLabel = (type: string, index: number) => {
    const prev = results[index - 1];
    if (!prev || prev.type !== type) {
      const labels: Record<string, string> = {
        collection: 'Collections',
        category: 'Categories',
        language: 'Languages',
        repo: 'Repositories',
      };
      return labels[type] || null;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-void/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-raised border border-border rounded-xl shadow-2xl shadow-void/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Command className="w-4 h-4 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search repos, categories, languages, collections..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted bg-overlay border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-6 h-6 text-muted mx-auto mb-2" />
              <p className="text-sm text-subtle">No results found</p>
            </div>
          ) : (
            results.map((result, i) => {
              const label = sectionLabel(result.type, i);
              return (
                <div key={`${result.type}-${i}`}>
                  {label && (
                    <div className="px-4 pt-2.5 pb-1">
                      <span className="text-[10px] font-bold text-subtle uppercase tracking-wider">{label}</span>
                    </div>
                  )}
                  <button
                    className={`w-full text-left px-4 py-2 flex items-center gap-3 cursor-pointer transition-colors ${
                      i === selectedIndex ? 'bg-accent/10 text-accent' : 'text-primary hover:bg-raised/80'
                    }`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    {result.type === 'repo' && (
                      <>
                        <Code2 className="w-3.5 h-3.5 text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{result.repo.fullName}</span>
                          <span className="text-xs text-subtle truncate block">{result.repo.description}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-dim">
                          <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-signal-amber/60" />{formatNum(result.repo.stars)}</span>
                          <span className="text-signal-green">+{formatNum(result.repo.starsWeekDelta)}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                      </>
                    )}
                    {result.type === 'category' && (
                      <>
                        <span className="w-3.5 text-center shrink-0">{CATEGORY_ICONS[result.category]}</span>
                        <span className="text-sm flex-1">{result.category}</span>
                        <span className="text-xs font-mono text-muted">{result.count} repos</span>
                        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                      </>
                    )}
                    {result.type === 'language' && (
                      <>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: result.color }} />
                        <span className="text-sm flex-1">{result.language}</span>
                        <span className="text-xs font-mono text-muted">{result.count} repos</span>
                        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                      </>
                    )}
                    {result.type === 'collection' && (
                      <>
                        <span className="shrink-0" style={{ color: result.collection.color }}>{result.collection.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{result.collection.label}</span>
                          <span className="text-xs text-subtle block">{result.collection.description}</span>
                        </div>
                        <span className="text-xs font-mono text-muted shrink-0">{result.count}</span>
                        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted font-mono">
          <span className="inline-flex items-center gap-1"><ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" /> navigate</span>
          <span className="inline-flex items-center gap-1"><kbd className="bg-overlay border border-border rounded px-1">↵</kbd> select</span>
          <span className="inline-flex items-center gap-1"><kbd className="bg-overlay border border-border rounded px-1">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

type SortKey = 'stars' | 'starsWeekDelta' | 'forks' | 'name';
type ViewMode = 'list' | 'grid' | 'digest';

function App() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('starsWeekDelta');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<ViewMode>('list');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const { repos, loading, error, lastUpdated, refresh, isFromCache, isFromSeed } = useRepos();
  const { status: openfangStatus } = useOpenFang();
  const { alerts, unseenCount, markAllSeen, clearAlerts } = useAlerts(repos);

  // Cmd+K to open command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close alerts on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    }
    if (alertsOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [alertsOpen]);

  const filtered = useMemo(() => {
    // If a smart collection is active, use its filter
    if (activeCollection) {
      const col = SMART_COLLECTIONS.find(c => c.id === activeCollection);
      if (col) return col.filter(repos);
    }
    let result = [...repos];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        r => r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.language.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    if (activeCategory) result = result.filter(r => r.category === activeCategory);
    result.sort((a, b) => {
      const aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string')
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [repos, search, activeCategory, activeCollection, sortBy, sortDir]);

  const topMovers = useMemo(() => {
    let pool = [...repos];
    if (activeCategory) pool = pool.filter(r => r.category === activeCategory);
    return pool.sort((a, b) => b.starsWeekDelta - a.starsWeekDelta).slice(0, 3);
  }, [repos, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<Category, number>> = {};
    for (const r of repos) counts[r.category] = (counts[r.category] || 0) + 1;
    return counts;
  }, [repos]);

  const totalStars = useMemo(() => repos.reduce((s, r) => s + r.stars, 0), [repos]);
  const totalVelocity = useMemo(() => repos.reduce((s, r) => s + r.starsWeekDelta, 0), [repos]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`text-xs px-2.5 py-1 rounded-md transition-colors duration-100 cursor-pointer flex items-center gap-1 font-medium ${
        sortBy === k ? 'text-accent bg-accent/10 border border-accent/20' : 'text-subtle hover:text-dim border border-transparent'
      }`}
    >
      {label}
      {sortBy === k && (sortDir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
    </button>
  );

  const showFeatured = !search && !activeCollection && sortBy === 'starsWeekDelta' && sortDir === 'desc' && view !== 'digest';

  const handleCollectionSelect = useCallback((id: string | null) => {
    setActiveCollection(id);
    if (id) { setSearch(''); setActiveCategory(null); }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-grid noise relative">
      {/* Command Palette */}
      <CommandPalette
        repos={repos}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectRepo={(url) => window.open(url, '_blank')}
        onSelectCategory={(cat) => { setActiveCategory(cat); setActiveCollection(null); }}
        onSelectCollection={(id) => handleCollectionSelect(id)}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-void/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1440px] mx-auto px-5 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent/15 border border-accent/25 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-sm font-bold text-bright tracking-tight">SourceSignal</span>
            </div>
            <span className="hidden sm:block text-[10px] text-subtle bg-overlay px-2 py-0.5 rounded-full border border-border font-mono">AI/ML</span>
          </div>

          {/* Search + Cmd+K */}
          <div className="flex-1 max-w-lg">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full bg-raised border border-border rounded-lg px-3 py-2 text-sm text-muted flex items-center gap-2 hover:border-accent/50 hover:bg-overlay transition-all duration-150 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-subtle" />
              <span className="flex-1 text-left">Search repos, categories, collections...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted bg-overlay border border-border rounded px-1.5 py-0.5 font-mono">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>

          {/* Status + Actions */}
          <div className="flex items-center gap-3 text-xs shrink-0">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />}
            <div className="hidden lg:flex items-center gap-3 font-mono text-dim tabular-nums">
              <span>{repos.length} repos</span>
              <span className="text-border">|</span>
              <span>{formatNum(totalStars)} stars</span>
              <span className="text-border">|</span>
              <span className="text-signal-green">+{formatNum(totalVelocity)}/w</span>
            </div>

            {/* OpenFang status */}
            {openfangStatus.connected && (
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-overlay rounded-md border border-border" title={`OpenFang v${openfangStatus.version}${openfangStatus.collectorActive ? ' — Collector active' : ''}`}>
                <Radio className={`w-3 h-3 ${openfangStatus.collectorActive ? 'text-signal-green' : 'text-subtle'}`} />
                <span className="text-[10px] font-mono text-dim">OF</span>
                {openfangStatus.collectorActive && <Check className="w-2.5 h-2.5 text-signal-green" />}
              </div>
            )}

            {/* Data source */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isFromSeed ? 'bg-signal-amber' : isFromCache ? 'bg-subtle' : 'bg-signal-green status-live'}`} />
              <span className="text-subtle font-mono text-[11px]">
                {isFromSeed ? 'seed' : isFromCache ? 'cached' : 'live'}
                {lastUpdated && <span className="text-muted ml-1">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </span>
            </div>

            {/* Alerts */}
            <div className="relative" ref={alertRef}>
              <button
                onClick={() => { setAlertsOpen(!alertsOpen); if (!alertsOpen && unseenCount > 0) markAllSeen(); }}
                className="p-1.5 rounded-md hover:bg-overlay border border-transparent hover:border-border cursor-pointer transition-all relative"
                title="Alerts"
              >
                <Bell className="w-3.5 h-3.5 text-subtle" />
                {unseenCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-signal-red text-void text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unseenCount > 9 ? '9+' : unseenCount}
                  </span>
                )}
              </button>
              {alertsOpen && (
                <AlertPanel alerts={alerts} onMarkSeen={markAllSeen} onClear={clearAlerts} onClose={() => setAlertsOpen(false)} />
              )}
            </div>

            {/* Refresh */}
            <button onClick={refresh} disabled={loading} className="p-1.5 rounded-md hover:bg-overlay border border-transparent hover:border-border cursor-pointer disabled:opacity-30 transition-all" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 text-subtle ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1440px] mx-auto w-full">
        {/* ── Sidebar ── */}
        <nav className="w-56 shrink-0 border-r border-border py-4 px-3 hidden md:flex flex-col gap-1">
          <p className="text-[10px] font-semibold text-subtle uppercase tracking-[0.15em] px-2 mb-1">Signal Categories</p>
          <button
            onClick={() => setActiveCategory(null)}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition-all duration-100 cursor-pointer flex justify-between items-center ${
              !activeCategory ? 'bg-accent/10 text-accent border border-accent/15 font-medium' : 'text-dim hover:text-primary hover:bg-raised border border-transparent'
            }`}
          >
            <span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" />All Signals</span>
            <span className={`text-xs font-mono tabular-nums ${!activeCategory ? 'text-accent/70' : 'text-muted'}`}>{repos.length}</span>
          </button>

          <div className="w-full h-px bg-border my-1" />

          {CATEGORIES.filter(c => categoryCounts[c]).map(cat => {
            const color = CATEGORY_COLORS[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition-all duration-100 cursor-pointer flex justify-between items-center group ${
                  isActive ? 'bg-raised text-primary font-medium border border-border-bright' : 'text-dim hover:text-primary hover:bg-raised/60 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-all ${isActive ? 'scale-125' : 'opacity-50 group-hover:opacity-100'}`} style={{ backgroundColor: color }} />
                  <span className="truncate">{cat}</span>
                </span>
                <span className={`text-xs font-mono tabular-nums shrink-0 ml-2 ${isActive ? 'text-dim' : 'text-muted'}`}>{categoryCounts[cat]}</span>
              </button>
            );
          })}

          {/* OpenFang status in sidebar */}
          {openfangStatus.connected && (
            <>
              <div className="w-full h-px bg-border my-2" />
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className={`w-3.5 h-3.5 ${openfangStatus.collectorActive ? 'text-signal-green' : 'text-muted'}`} />
                  <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider">OpenFang</span>
                </div>
                <div className="space-y-1 text-[10px] font-mono text-dim">
                  <div className="flex justify-between">
                    <span className="text-subtle">Version</span>
                    <span>{openfangStatus.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-subtle">Collector</span>
                    <span className={openfangStatus.collectorActive ? 'text-signal-green' : 'text-signal-red'}>
                      {openfangStatus.collectorActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {openfangStatus.metrics.dataPoints != null && (
                    <div className="flex justify-between">
                      <span className="text-subtle">Data Points</span>
                      <span>{openfangStatus.metrics.dataPoints}</span>
                    </div>
                  )}
                  {openfangStatus.metrics.entitiesTracked != null && (
                    <div className="flex justify-between">
                      <span className="text-subtle">Entities</span>
                      <span>{openfangStatus.metrics.entitiesTracked}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="mx-4 mt-3 px-4 py-2.5 rounded-lg bg-signal-amber/5 border border-signal-amber/20 text-signal-amber text-sm flex justify-between items-center">
              <span className="text-xs">{error}</span>
              <button onClick={refresh} className="text-xs font-medium underline cursor-pointer hover:no-underline">Retry</button>
            </div>
          )}

          {/* Mobile categories */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto md:hidden border-b border-border">
            <button onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-xs cursor-pointer font-medium transition-colors ${!activeCategory ? 'bg-accent/15 text-accent' : 'text-subtle hover:text-dim'}`}>All</button>
            {CATEGORIES.filter(c => categoryCounts[c]).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs cursor-pointer font-medium transition-colors ${activeCategory === cat ? 'bg-accent/15 text-accent' : 'text-subtle hover:text-dim'}`}>{cat}</button>
            ))}
          </div>

          {/* Smart Collections */}
          {!search && view !== 'digest' && (
            <SmartCollections
              repos={repos}
              activeCollection={activeCollection}
              onSelect={handleCollectionSelect}
            />
          )}

          {/* Active collection indicator */}
          {activeCollection && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20 flex items-center justify-between">
              <span className="text-xs text-accent font-medium">
                Showing: {SMART_COLLECTIONS.find(c => c.id === activeCollection)?.label}
              </span>
              <button onClick={() => setActiveCollection(null)} className="text-xs text-subtle hover:text-primary cursor-pointer flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}

          {/* Featured: Top Movers */}
          {showFeatured && topMovers.length > 0 && (
            <div className="p-4 pb-2 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-signal-amber" />
                <h2 className="text-xs font-bold text-dim uppercase tracking-wider">Top Movers This Week</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topMovers.map((repo, i) => (
                  <FeaturedCard key={repo.id} repo={repo} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/50">
            <div className="flex items-center gap-2 text-xs text-subtle font-mono">
              <span className="tabular-nums">{filtered.length} results</span>
              {activeCategory && (
                <span className="text-accent flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[activeCategory] }} />
                  {activeCategory}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {view !== 'digest' && (
                <>
                  <SortBtn k="starsWeekDelta" label="Velocity" />
                  <SortBtn k="stars" label="Stars" />
                  <SortBtn k="forks" label="Forks" />
                  <SortBtn k="name" label="Name" />
                  <span className="w-px h-5 bg-border mx-1.5" />
                </>
              )}
              <button onClick={() => setView('list')} className={`p-1.5 rounded-md cursor-pointer transition-colors ${view === 'list' ? 'text-accent bg-accent/10' : 'text-muted hover:text-subtle'}`} title="List view">
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('grid')} className={`p-1.5 rounded-md cursor-pointer transition-colors ${view === 'grid' ? 'text-accent bg-accent/10' : 'text-muted hover:text-subtle'}`} title="Grid view">
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('digest')} className={`p-1.5 rounded-md cursor-pointer transition-colors ${view === 'digest' ? 'text-accent bg-accent/10' : 'text-muted hover:text-subtle'}`} title="Weekly digest">
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Column headers for list view */}
          {view === 'list' && filtered.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-mono text-muted uppercase tracking-wider border-b border-border/40 bg-raised/30">
              <span className="w-7 text-right">#</span>
              <span className="w-2" />
              <span className="flex-1">Repository</span>
              <span className="w-16 shrink-0" />
              <span className="w-16 text-right shrink-0">Stars</span>
              <span className="w-16 text-right shrink-0">+/Week</span>
              <span className="w-14 text-right shrink-0">Forks</span>
              <span className="w-24 shrink-0">Lang</span>
              <span className="w-14 text-right shrink-0">Push</span>
            </div>
          )}

          {/* Content */}
          {view === 'digest' ? (
            <DigestView repos={filtered} />
          ) : view === 'list' ? (
            <div>
              {filtered.map((repo, i) => (
                <RepoRow key={repo.id} repo={repo} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              {filtered.map(repo => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}

          {filtered.length === 0 && view !== 'digest' && (
            <div className="text-center py-20">
              <Search className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-dim text-sm font-medium">No signals match your filters</p>
              <p className="text-subtle text-xs mt-1">Try broadening your search or category</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-3 px-5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-accent/50" />
            <span className="text-[11px] text-muted font-mono">SourceSignal</span>
          </div>
          <p className="text-[11px] text-muted font-mono">
            GitHub API &middot; 1 hr cache
            {openfangStatus.connected && ' \u00b7 OpenFang connected'}
            {isFromSeed && ' \u00b7 showing seed data'}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
