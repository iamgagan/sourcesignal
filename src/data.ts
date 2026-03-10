export interface Repo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  starsWeekDelta: number;
  forks: number;
  language: string;
  category: Category;
  lastCommit: string;
  contributors: number;
  openIssues: number;
  license: string;
  trending: boolean;
}

export type Category =
  | 'Agent Frameworks'
  | 'LLM Tools'
  | 'RAG'
  | 'Vector Databases'
  | 'Eval & Benchmarks'
  | 'AI Coding'
  | 'Model Serving'
  | 'MLOps'
  | 'Multimodal'
  | 'Data & Datasets';

export const CATEGORIES: Category[] = [
  'Agent Frameworks',
  'LLM Tools',
  'RAG',
  'Vector Databases',
  'Eval & Benchmarks',
  'AI Coding',
  'Model Serving',
  'MLOps',
  'Multimodal',
  'Data & Datasets',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Agent Frameworks': '#818cf8',
  'LLM Tools': '#34d399',
  'RAG': '#fbbf24',
  'Vector Databases': '#f87171',
  'Eval & Benchmarks': '#a78bfa',
  'AI Coding': '#38bdf8',
  'Model Serving': '#fb923c',
  'MLOps': '#f472b6',
  'Multimodal': '#2dd4bf',
  'Data & Datasets': '#86efac',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  'Agent Frameworks': '🤖',
  'LLM Tools': '🧠',
  'RAG': '🔗',
  'Vector Databases': '📐',
  'Eval & Benchmarks': '📊',
  'AI Coding': '💻',
  'Model Serving': '🚀',
  'MLOps': '⚙️',
  'Multimodal': '👁️',
  'Data & Datasets': '📦',
};

// Seed data — will be replaced by OpenFang Collector data
export const SEED_REPOS: Repo[] = [
  {
    id: '1', name: 'langchain', fullName: 'langchain-ai/langchain',
    description: 'Build context-aware reasoning applications',
    url: 'https://github.com/langchain-ai/langchain',
    stars: 98200, starsWeekDelta: 1240, forks: 15800, language: 'Python',
    category: 'Agent Frameworks', lastCommit: '2h ago', contributors: 2800,
    openIssues: 1420, license: 'MIT', trending: true,
  },
  {
    id: '2', name: 'crewai', fullName: 'crewAIInc/crewAI',
    description: 'Framework for orchestrating role-playing autonomous AI agents',
    url: 'https://github.com/crewAIInc/crewAI',
    stars: 25400, starsWeekDelta: 890, forks: 3200, language: 'Python',
    category: 'Agent Frameworks', lastCommit: '5h ago', contributors: 340,
    openIssues: 280, license: 'MIT', trending: true,
  },
  {
    id: '3', name: 'ollama', fullName: 'ollama/ollama',
    description: 'Get up and running with large language models locally',
    url: 'https://github.com/ollama/ollama',
    stars: 112000, starsWeekDelta: 2100, forks: 8900, language: 'Go',
    category: 'LLM Tools', lastCommit: '1h ago', contributors: 520,
    openIssues: 1890, license: 'MIT', trending: true,
  },
  {
    id: '4', name: 'vllm', fullName: 'vllm-project/vllm',
    description: 'High-throughput and memory-efficient inference engine for LLMs',
    url: 'https://github.com/vllm-project/vllm',
    stars: 42800, starsWeekDelta: 980, forks: 6200, language: 'Python',
    category: 'Model Serving', lastCommit: '3h ago', contributors: 780,
    openIssues: 2100, license: 'Apache-2.0', trending: true,
  },
  {
    id: '5', name: 'qdrant', fullName: 'qdrant/qdrant',
    description: 'High-performance vector similarity search engine and database',
    url: 'https://github.com/qdrant/qdrant',
    stars: 22600, starsWeekDelta: 420, forks: 1500, language: 'Rust',
    category: 'Vector Databases', lastCommit: '6h ago', contributors: 190,
    openIssues: 340, license: 'Apache-2.0', trending: false,
  },
  {
    id: '6', name: 'dspy', fullName: 'stanfordnlp/dspy',
    description: 'Programming—not prompting—language models',
    url: 'https://github.com/stanfordnlp/dspy',
    stars: 21800, starsWeekDelta: 650, forks: 1700, language: 'Python',
    category: 'LLM Tools', lastCommit: '4h ago', contributors: 280,
    openIssues: 410, license: 'MIT', trending: true,
  },
  {
    id: '7', name: 'cursor', fullName: 'getcursor/cursor',
    description: 'The AI Code Editor',
    url: 'https://github.com/getcursor/cursor',
    stars: 48200, starsWeekDelta: 1800, forks: 3100, language: 'TypeScript',
    category: 'AI Coding', lastCommit: '12h ago', contributors: 45,
    openIssues: 890, license: 'Proprietary', trending: true,
  },
  {
    id: '8', name: 'autogen', fullName: 'microsoft/autogen',
    description: 'An open-source framework for building AI agent systems',
    url: 'https://github.com/microsoft/autogen',
    stars: 38500, starsWeekDelta: 720, forks: 5600, language: 'Python',
    category: 'Agent Frameworks', lastCommit: '8h ago', contributors: 460,
    openIssues: 780, license: 'MIT', trending: false,
  },
  {
    id: '9', name: 'ragas', fullName: 'explodinggradients/ragas',
    description: 'Evaluation framework for your Retrieval Augmented Generation pipelines',
    url: 'https://github.com/explodinggradients/ragas',
    stars: 8400, starsWeekDelta: 310, forks: 820, language: 'Python',
    category: 'Eval & Benchmarks', lastCommit: '1d ago', contributors: 140,
    openIssues: 190, license: 'Apache-2.0', trending: true,
  },
  {
    id: '10', name: 'chromadb', fullName: 'chroma-core/chroma',
    description: 'The AI-native open-source embedding database',
    url: 'https://github.com/chroma-core/chroma',
    stars: 16800, starsWeekDelta: 280, forks: 1400, language: 'Rust',
    category: 'Vector Databases', lastCommit: '10h ago', contributors: 210,
    openIssues: 520, license: 'Apache-2.0', trending: false,
  },
  {
    id: '11', name: 'llama.cpp', fullName: 'ggerganov/llama.cpp',
    description: 'LLM inference in C/C++',
    url: 'https://github.com/ggerganov/llama.cpp',
    stars: 74500, starsWeekDelta: 1450, forks: 10700, language: 'C++',
    category: 'Model Serving', lastCommit: '30m ago', contributors: 890,
    openIssues: 640, license: 'MIT', trending: true,
  },
  {
    id: '12', name: 'langgraph', fullName: 'langchain-ai/langgraph',
    description: 'Build resilient language agents as graphs',
    url: 'https://github.com/langchain-ai/langgraph',
    stars: 8900, starsWeekDelta: 520, forks: 1400, language: 'Python',
    category: 'Agent Frameworks', lastCommit: '2h ago', contributors: 120,
    openIssues: 310, license: 'MIT', trending: true,
  },
  {
    id: '13', name: 'aider', fullName: 'paul-gauthier/aider',
    description: 'AI pair programming in your terminal',
    url: 'https://github.com/paul-gauthier/aider',
    stars: 27400, starsWeekDelta: 940, forks: 2600, language: 'Python',
    category: 'AI Coding', lastCommit: '3h ago', contributors: 380,
    openIssues: 210, license: 'Apache-2.0', trending: true,
  },
  {
    id: '14', name: 'milvus', fullName: 'milvus-io/milvus',
    description: 'Cloud-native vector database for scalable similarity search',
    url: 'https://github.com/milvus-io/milvus',
    stars: 32400, starsWeekDelta: 380, forks: 3100, language: 'Go',
    category: 'Vector Databases', lastCommit: '4h ago', contributors: 420,
    openIssues: 890, license: 'Apache-2.0', trending: false,
  },
  {
    id: '15', name: 'openai-agents-sdk', fullName: 'openai/openai-agents-python',
    description: 'OpenAI Agents SDK for Python',
    url: 'https://github.com/openai/openai-agents-python',
    stars: 5200, starsWeekDelta: 1680, forks: 580, language: 'Python',
    category: 'Agent Frameworks', lastCommit: '6h ago', contributors: 28,
    openIssues: 120, license: 'MIT', trending: true,
  },
  {
    id: '16', name: 'openfang', fullName: 'RightNow-AI/openfang',
    description: 'Open-source Agent Operating System written in Rust',
    url: 'https://github.com/RightNow-AI/openfang',
    stars: 4800, starsWeekDelta: 1420, forks: 320, language: 'Rust',
    category: 'Agent Frameworks', lastCommit: '1h ago', contributors: 42,
    openIssues: 85, license: 'MIT', trending: true,
  },
  {
    id: '17', name: 'mlflow', fullName: 'mlflow/mlflow',
    description: 'Open source platform for the machine learning lifecycle',
    url: 'https://github.com/mlflow/mlflow',
    stars: 19800, starsWeekDelta: 180, forks: 4500, language: 'Python',
    category: 'MLOps', lastCommit: '2h ago', contributors: 890,
    openIssues: 1200, license: 'Apache-2.0', trending: false,
  },
  {
    id: '18', name: 'livekit-agents', fullName: 'livekit/agents',
    description: 'Build real-time multimodal AI applications',
    url: 'https://github.com/livekit/agents',
    stars: 6200, starsWeekDelta: 780, forks: 480, language: 'Python',
    category: 'Multimodal', lastCommit: '5h ago', contributors: 65,
    openIssues: 140, license: 'Apache-2.0', trending: true,
  },
  {
    id: '19', name: 'mastra', fullName: 'mastra-ai/mastra',
    description: 'The TypeScript AI agent framework',
    url: 'https://github.com/mastra-ai/mastra',
    stars: 8400, starsWeekDelta: 1100, forks: 420, language: 'TypeScript',
    category: 'Agent Frameworks', lastCommit: '1h ago', contributors: 55,
    openIssues: 95, license: 'MIT', trending: true,
  },
  {
    id: '21', name: 'autoresearch', fullName: 'karpathy/autoresearch',
    description: 'AI agents autonomously conduct LLM research — modify code, run 5-min experiments, iterate on results',
    url: 'https://github.com/karpathy/autoresearch',
    stars: 16500, starsWeekDelta: 16500, forks: 2100, language: 'Python',
    category: 'Eval & Benchmarks', lastCommit: '2h ago', contributors: 12,
    openIssues: 45, license: 'MIT', trending: true,
  },
  {
    id: '22', name: 'khoj', fullName: 'khoj-ai/khoj',
    description: 'Your AI second brain. Self-hostable. Get answers from the web or your docs.',
    url: 'https://github.com/khoj-ai/khoj',
    stars: 33300, starsWeekDelta: 563, forks: 1700, language: 'Python',
    category: 'RAG', lastCommit: '4h ago', contributors: 85,
    openIssues: 220, license: 'AGPL-3.0', trending: true,
  },
  {
    id: '23', name: 'flash-attention', fullName: 'Dao-AILab/flash-attention',
    description: 'Fast and memory-efficient exact attention',
    url: 'https://github.com/Dao-AILab/flash-attention',
    stars: 22700, starsWeekDelta: 244, forks: 2300, language: 'Python',
    category: 'Model Serving', lastCommit: '1d ago', contributors: 120,
    openIssues: 680, license: 'BSD-3', trending: false,
  },
  {
    id: '24', name: 'coqui-tts', fullName: 'coqui-ai/TTS',
    description: 'Deep learning toolkit for text-to-speech, battle-tested in research and production',
    url: 'https://github.com/coqui-ai/TTS',
    stars: 44800, starsWeekDelta: 420, forks: 5400, language: 'Python',
    category: 'Multimodal', lastCommit: '3d ago', contributors: 180,
    openIssues: 340, license: 'MPL-2.0', trending: false,
  },
  {
    id: '25', name: 'google-adk', fullName: 'google/adk-python',
    description: 'Google Agent Development Kit for building AI agents',
    url: 'https://github.com/google/adk-python',
    stars: 7800, starsWeekDelta: 2400, forks: 620, language: 'Python',
    category: 'Agent Frameworks', lastCommit: '6h ago', contributors: 32,
    openIssues: 110, license: 'Apache-2.0', trending: true,
  },
  {
    id: '20', name: 'haystack', fullName: 'deepset-ai/haystack',
    description: 'LLM orchestration framework to build customizable, production-ready LLM applications',
    url: 'https://github.com/deepset-ai/haystack',
    stars: 18200, starsWeekDelta: 340, forks: 1900, language: 'Python',
    category: 'RAG', lastCommit: '6h ago', contributors: 310,
    openIssues: 280, license: 'Apache-2.0', trending: false,
  },
];
