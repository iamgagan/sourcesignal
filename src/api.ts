import type { Repo, Category } from './data';

// --- GitHub API types ---

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  open_issues_count: number;
  pushed_at: string;
  created_at: string;
  topics: string[];
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

// --- Category classification ---

const TOPIC_TO_CATEGORY: Record<string, Category> = {
  agent: 'Agent Frameworks',
  agents: 'Agent Frameworks',
  'agent-framework': 'Agent Frameworks',
  'ai-agent': 'Agent Frameworks',
  'ai-agents': 'Agent Frameworks',
  'autonomous-agents': 'Agent Frameworks',
  'multi-agent': 'Agent Frameworks',
  llm: 'LLM Tools',
  'large-language-model': 'LLM Tools',
  'large-language-models': 'LLM Tools',
  'language-model': 'LLM Tools',
  gpt: 'LLM Tools',
  chatgpt: 'LLM Tools',
  openai: 'LLM Tools',
  'prompt-engineering': 'LLM Tools',
  rag: 'RAG',
  'retrieval-augmented-generation': 'RAG',
  'information-retrieval': 'RAG',
  'knowledge-base': 'RAG',
  'vector-database': 'Vector Databases',
  'vector-search': 'Vector Databases',
  'vector-store': 'Vector Databases',
  'similarity-search': 'Vector Databases',
  embedding: 'Vector Databases',
  embeddings: 'Vector Databases',
  benchmark: 'Eval & Benchmarks',
  benchmarks: 'Eval & Benchmarks',
  evaluation: 'Eval & Benchmarks',
  eval: 'Eval & Benchmarks',
  'ai-coding': 'AI Coding',
  'code-generation': 'AI Coding',
  copilot: 'AI Coding',
  'code-assistant': 'AI Coding',
  'ai-pair-programming': 'AI Coding',
  'model-serving': 'Model Serving',
  inference: 'Model Serving',
  'llm-inference': 'Model Serving',
  serving: 'Model Serving',
  quantization: 'Model Serving',
  mlops: 'MLOps',
  'ml-ops': 'MLOps',
  'machine-learning-operations': 'MLOps',
  'model-training': 'MLOps',
  'experiment-tracking': 'MLOps',
  multimodal: 'Multimodal',
  'text-to-speech': 'Multimodal',
  'speech-to-text': 'Multimodal',
  'computer-vision': 'Multimodal',
  'image-generation': 'Multimodal',
  'text-to-image': 'Multimodal',
  dataset: 'Data & Datasets',
  datasets: 'Data & Datasets',
  'data-pipeline': 'Data & Datasets',
  'data-processing': 'Data & Datasets',
};

const DESCRIPTION_KEYWORDS: [RegExp, Category][] = [
  [/\bagent(s|ic)?\b.*\b(framework|orchestrat|autonom)/i, 'Agent Frameworks'],
  [/\b(multi-agent|agentic|agent system)/i, 'Agent Frameworks'],
  [/\b(rag|retrieval.augmented|retrieval.*generation)\b/i, 'RAG'],
  [/\b(vector.*(database|db|store|search)|embedding.*(search|store))\b/i, 'Vector Databases'],
  [/\b(benchmark|eval(uation)?|leaderboard)\b/i, 'Eval & Benchmarks'],
  [/\b(code.*(generat|assist|complet)|pair.program|ai.*cod(e|ing))\b/i, 'AI Coding'],
  [/\b(inference|model.serv|deploy.*model|quantiz)/i, 'Model Serving'],
  [/\b(mlops|ml.*pipeline|experiment.*track|model.*registry)\b/i, 'MLOps'],
  [/\b(multimodal|vision.*language|text.to.speech|speech.to.text|image.*generat)\b/i, 'Multimodal'],
  [/\b(dataset|data.*pipeline|data.*process|data.*label)\b/i, 'Data & Datasets'],
  [/\b(llm|language.model|gpt|prompt|chat.*bot)\b/i, 'LLM Tools'],
];

function categorizeRepo(gh: GitHubRepo): Category {
  // 1. Check topics first (highest confidence)
  for (const topic of gh.topics) {
    const lower = topic.toLowerCase();
    if (TOPIC_TO_CATEGORY[lower]) {
      return TOPIC_TO_CATEGORY[lower];
    }
  }

  // 2. Check description keywords
  const desc = gh.description ?? '';
  for (const [pattern, category] of DESCRIPTION_KEYWORDS) {
    if (pattern.test(desc)) {
      return category;
    }
  }

  // 3. Check repo name as last resort
  const name = gh.name.toLowerCase();
  if (name.includes('agent')) return 'Agent Frameworks';
  if (name.includes('rag')) return 'RAG';
  if (name.includes('vector') || name.includes('embed')) return 'Vector Databases';
  if (name.includes('eval') || name.includes('bench')) return 'Eval & Benchmarks';
  if (name.includes('code') || name.includes('copilot')) return 'AI Coding';
  if (name.includes('serv') || name.includes('infer')) return 'Model Serving';
  if (name.includes('mlops')) return 'MLOps';

  return 'LLM Tools';
}

// --- Star velocity estimation ---

function estimateWeeklyStarDelta(gh: GitHubRepo): number {
  const createdAt = new Date(gh.created_at).getTime();
  const now = Date.now();
  const ageInWeeks = Math.max((now - createdAt) / (7 * 24 * 60 * 60 * 1000), 1);

  // For very new repos (< 4 weeks), the average rate is likely close to recent velocity
  if (ageInWeeks < 4) {
    return Math.round(gh.stargazers_count / ageInWeeks);
  }

  // For older repos, use a decay model: recent velocity is typically
  // higher than lifetime average, so multiply by a factor
  const lifetimeAvg = gh.stargazers_count / ageInWeeks;

  // Repos that were recently pushed are likely more active
  const lastPush = new Date(gh.pushed_at).getTime();
  const daysSinceLastPush = (now - lastPush) / (24 * 60 * 60 * 1000);

  let recencyMultiplier = 1.5;
  if (daysSinceLastPush < 1) recencyMultiplier = 3.0;
  else if (daysSinceLastPush < 7) recencyMultiplier = 2.0;
  else if (daysSinceLastPush < 30) recencyMultiplier = 1.2;
  else recencyMultiplier = 0.8;

  return Math.round(lifetimeAvg * recencyMultiplier);
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

// --- Transform GitHub API response to our Repo type ---

function ghToRepo(gh: GitHubRepo): Repo {
  const weekDelta = estimateWeeklyStarDelta(gh);
  return {
    id: gh.id.toString(),
    name: gh.name,
    fullName: gh.full_name,
    description: gh.description ?? 'No description provided',
    url: gh.html_url,
    stars: gh.stargazers_count,
    starsWeekDelta: weekDelta,
    forks: gh.forks_count,
    language: gh.language ?? 'Unknown',
    category: categorizeRepo(gh),
    lastCommit: relativeTime(gh.pushed_at),
    contributors: 0, // Not available from search API without extra requests
    openIssues: gh.open_issues_count,
    license: gh.license?.spdx_id ?? 'Unknown',
    trending: weekDelta > 500 || (gh.stargazers_count > 1000 && weekDelta > 200),
  };
}

// --- API fetching ---

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

async function searchRepos(query: string, perPage = 30): Promise<GitHubRepo[]> {
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });

  if (res.status === 403 || res.status === 429) {
    throw new RateLimitError('GitHub API rate limit exceeded');
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data: GitHubSearchResponse = await res.json();
  return data.items;
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Fetch trending AI/ML repos from GitHub search API (unauthenticated).
 * Makes up to 3 search queries and deduplicates results.
 */
export async function fetchTrendingAIRepos(): Promise<Repo[]> {
  const queries = [
    'topic:machine-learning stars:>500 pushed:>2025-01-01',
    'topic:artificial-intelligence stars:>500 pushed:>2025-01-01',
    'topic:llm stars:>200 pushed:>2025-01-01',
    'topic:ai-agent stars:>100',
    'topic:agent-framework stars:>100',
    'topic:rag stars:>100',
    'topic:vector-database stars:>100',
    'topic:deep-learning stars:>1000 pushed:>2025-06-01',
    'topic:mlops stars:>200',
    'topic:computer-vision stars:>500',
    'topic:inference stars:>200',
    'topic:code-generation stars:>200',
    'created:>2026-01-01 stars:>100 topic:ai',
    'created:>2026-02-01 stars:>50 language:python topic:machine-learning',
  ];

  const seen = new Set<number>();
  const allRepos: GitHubRepo[] = [];

  for (const query of queries) {
    try {
      const repos = await searchRepos(query, 100);
      for (const repo of repos) {
        if (!seen.has(repo.id)) {
          seen.add(repo.id);
          allRepos.push(repo);
        }
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        throw err;
      }
      console.warn(`GitHub search query failed: ${query}`, err);
    }
  }

  if (allRepos.length === 0) {
    throw new Error('No repos returned from GitHub API');
  }

  return allRepos.map(ghToRepo);
}

/**
 * Fetch recently trending repos (pushed in last 7 days, sorted by stars).
 * Used by useGitHubTrending hook.
 */
export async function fetchRecentlyTrending(): Promise<Repo[]> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const query = `stars:>1000 pushed:>${oneWeekAgo} topic:machine-learning OR topic:artificial-intelligence OR topic:llm OR topic:deep-learning`;

  try {
    const repos = await searchRepos(query, 30);
    return repos.map(ghToRepo);
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    console.warn('Failed to fetch recently trending repos', err);
    return [];
  }
}

// --- localStorage caching ---

const CACHE_KEY = 'sourcesignal_repos_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  repos: Repo[];
  timestamp: number;
}

export function getCachedRepos(): Repo[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.repos;
  } catch {
    return null;
  }
}

export function setCachedRepos(repos: Repo[]): void {
  try {
    const entry: CacheEntry = { repos, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage might be full or unavailable; silently ignore
  }
}

export function getCacheTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.timestamp;
  } catch {
    return null;
  }
}
