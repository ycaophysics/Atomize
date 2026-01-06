import type { LLMProvider, LLMMessage, LLMGenerateOptions, LLMResponse } from './types';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; model?: string; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.0-flash';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResponse> {
    const contents = this.convertMessages(messages);

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 2048,
            stopSequences: options?.stopSequences,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate) {
      throw new Error('No response from Gemini');
    }

    return {
      content: candidate.content?.parts?.[0]?.text || '',
      finishReason: this.mapFinishReason(candidate.finishReason),
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }

  async generateJSON<T>(
    messages: LLMMessage[],
    schema: object,
    options?: LLMGenerateOptions
  ): Promise<T> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const jsonPrompt = `${systemMessage?.content || ''}

You must respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Respond ONLY with the JSON object, no markdown or explanation.`;

    const modifiedMessages: LLMMessage[] = [
      { role: 'system', content: jsonPrompt },
      ...otherMessages,
    ];

    const response = await this.generate(modifiedMessages, options);

    try {
      // Try to extract JSON from the response
      let jsonStr = response.content.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      return JSON.parse(jsonStr.trim()) as T;
    } catch {
      throw new Error(`Failed to parse JSON response: ${response.content}`);
    }
  }

  private convertMessages(messages: LLMMessage[]): object[] {
    const contents: object[] = [];
    let systemInstruction = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction += msg.content + '\n';
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Prepend system instruction to first user message if exists
    if (systemInstruction && contents.length > 0) {
      const first = contents[0] as { parts: { text: string }[] };
      first.parts[0].text = `${systemInstruction}\n${first.parts[0].text}`;
    }

    return contents;
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'error' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      default:
        return 'error';
    }
  }
}
