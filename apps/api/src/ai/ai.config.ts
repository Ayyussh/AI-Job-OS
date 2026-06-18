export interface AIModelConfig {
  name: string;
  role: 'matching' | 'search' | 'chatbot' | 'embedding' | 'code';
  priority: number; // 1 = highest
  maxTokens: number;
  temperature: number;
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  'deepseek-r1': {
    name: 'deepseek-r1',
    role: 'matching',
    priority: 1,
    maxTokens: 1000,
    temperature: 0.3,
  },
  'qwen3': {
    name: 'qwen3',
    role: 'matching',
    priority: 2,
    maxTokens: 800,
    temperature: 0.4,
  },
  'qwen2.5-coder': {
    name: 'qwen2.5-coder',
    role: 'code',
    priority: 1,
    maxTokens: 800,
    temperature: 0.2,
  },
  'llama3.2': {
    name: 'llama3.2',
    role: 'chatbot',
    priority: 1,
    maxTokens: 600,
    temperature: 0.7,
  },
  'qwen2.5': {
    name: 'qwen2.5',
    role: 'search',
    priority: 2,
    maxTokens: 500,
    temperature: 0.5,
  },
  'nomic-embed-text': {
    name: 'nomic-embed-text',
    role: 'embedding',
    priority: 1,
    maxTokens: 512,
    temperature: 0.1,
  },
};