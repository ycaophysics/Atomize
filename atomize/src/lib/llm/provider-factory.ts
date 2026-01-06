import type { LLMProvider, LLMProviderConfig } from './types';
import { GeminiProvider } from './gemini-provider';
import { OllamaProvider } from './ollama-provider';

export function createLLMProvider(config: LLMProviderConfig): LLMProvider {
  switch (config.provider) {
    case 'gemini':
      if (!config.apiKey) {
        throw new Error('Gemini provider requires an API key');
      }
      return new GeminiProvider({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
      });

    case 'ollama':
      return new OllamaProvider({
        baseUrl: config.baseUrl,
        model: config.model,
      });

    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

// Default provider based on environment
export function getDefaultProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER as 'gemini' | 'ollama' | undefined;
  const apiKey = process.env.GEMINI_API_KEY;
  const ollamaUrl = process.env.OLLAMA_URL;
  const model = process.env.LLM_MODEL;

  if (provider === 'ollama' || (!apiKey && ollamaUrl)) {
    return createLLMProvider({
      provider: 'ollama',
      baseUrl: ollamaUrl,
      model,
    });
  }

  if (apiKey) {
    return createLLMProvider({
      provider: 'gemini',
      apiKey,
      model,
    });
  }

  throw new Error(
    'No LLM provider configured. Set GEMINI_API_KEY for Gemini or OLLAMA_URL for Ollama.'
  );
}
