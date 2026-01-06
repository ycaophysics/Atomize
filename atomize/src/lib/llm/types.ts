// LLM Provider Types

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  readonly name: string;

  generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResponse>;

  generateJSON<T>(
    messages: LLMMessage[],
    schema: object,
    options?: LLMGenerateOptions
  ): Promise<T>;
}

export interface LLMProviderConfig {
  provider: 'gemini' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}
