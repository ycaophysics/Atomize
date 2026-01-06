import type { LLMProvider, LLMMessage, LLMGenerateOptions, LLMResponse } from './types';
import { generateContentAction } from '@/app/actions';

export class ServerActionProvider implements LLMProvider {
    readonly name = 'gemini-server';

    async generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResponse> {
        return await generateContentAction(messages, options);
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
}
