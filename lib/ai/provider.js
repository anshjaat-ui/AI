import { createOpenAIChatCompletion } from './openai.js';
import { createAnthropicChatCompletion } from './anthropic.js';

export const CODING_SYSTEM_PROMPT = `You are NoLimit Coder AI, an expert software engineer and coding assistant.
Help with code generation, debugging, architecture, refactoring, tests, security, performance, and developer tooling.
Prefer complete, working examples when the user asks for implementation.
Preserve the user's requested language, framework, style, and constraints.
State important assumptions. If a fact or API is uncertain, say so clearly instead of inventing details.
Keep explanations practical and avoid unnecessary verbosity.`;

const providers = {
  openai: createOpenAIChatCompletion,
  anthropic: createAnthropicChatCompletion,
};

export function getProviderName() {
  return (process.env.AI_PROVIDER || 'openai').toLowerCase();
}

export function getConfiguredModel() {
  return process.env.AI_MODEL || defaultModelForProvider(getProviderName());
}

export async function createChatCompletion(messages) {
  const providerName = getProviderName();
  const provider = providers[providerName];

  if (!provider) {
    throw new Error(`Unsupported AI_PROVIDER "${providerName}".`);
  }

  return provider({
    apiKey: process.env.AI_API_KEY,
    model: getConfiguredModel(),
    systemPrompt: CODING_SYSTEM_PROMPT,
    messages,
  });
}

function defaultModelForProvider(providerName) {
  if (providerName === 'anthropic') return 'claude-3-5-sonnet-latest';
  return 'gpt-4o-mini';
}
