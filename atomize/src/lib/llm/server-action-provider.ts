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

        // Debug logging
        console.log('[generateJSON] Raw response length:', response.content.length);
        console.log('[generateJSON] Raw response preview:', response.content.substring(0, 200));
        console.log('[generateJSON] Raw response end:', response.content.substring(response.content.length - 100));

        try {
            // Try to extract JSON from the response
            let jsonStr = response.content.trim();

            // Remove markdown code blocks if present (handles ```json, ``` with newlines/spaces)
            // First try: complete code block with closing fence
            const jsonBlockMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
            if (jsonBlockMatch) {
                jsonStr = jsonBlockMatch[1];
                console.log('[generateJSON] Extracted from complete code block');
            } else if (jsonStr.startsWith('```')) {
                // Fallback: code block without closing fence (truncated response)
                jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '');
                // Also remove trailing ``` if present but not matched by regex
                jsonStr = jsonStr.replace(/\s*```$/, '');
                console.log('[generateJSON] Extracted from incomplete code block');
            }

            console.log('[generateJSON] Cleaned JSON preview:', jsonStr.substring(0, 200));
            console.log('[generateJSON] Cleaned JSON end:', jsonStr.substring(jsonStr.length - 100));

            const parsed = JSON.parse(jsonStr.trim()) as T;
            console.log('[generateJSON] Successfully parsed JSON');
            return parsed;
        } catch (error) {
            const err = error as Error;
            console.error('[generateJSON] Parse error:', err.message);
            console.error('[generateJSON] Full response:', response.content);
            throw new Error(`Failed to parse JSON response: ${err.message}\n\nResponse preview: ${response.content.substring(0, 500)}...`);
        }
    }
}
