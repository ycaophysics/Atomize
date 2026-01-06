'use server';

import { GeminiProvider } from '@/lib/llm/gemini-provider';
import { LLMMessage, LLMGenerateOptions } from '@/lib/llm/types';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash';

// Initialize provider on the server
// We re-use GeminiProvider because it works fine on the server (using fetch)
const provider = new GeminiProvider({
    apiKey: apiKey || '',
    model,
});

export async function generateContentAction(
    messages: LLMMessage[],
    options?: LLMGenerateOptions
) {
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY is not set. Please set it in your .env file (no NEXT_PUBLIC_ prefix needed for server actions).'
        );
    }

    try {
        return await provider.generate(messages, options);
    } catch (error: any) {
        console.error('Gemini API Error in Server Action:', error);
        // Return a serializable error object or throw string
        throw new Error(error.message || 'Failed to generate content');
    }
}
