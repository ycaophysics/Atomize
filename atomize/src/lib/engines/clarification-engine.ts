import type { Task, PriorityLevel } from '@/lib/types';
import type { LLMProvider, LLMMessage } from '@/lib/llm';

export interface ClarificationAnalysis {
  needsClarification: boolean;
  missingInfo: string[];
  ambiguities: string[];
  confidence: number; // 0-1
}

export interface ClarifiedInput {
  title: string;
  description?: string;
  deadline?: Date;
  priority?: PriorityLevel;
  estimatedMinutes?: number;
  confidence: number;
}

const MAX_QUESTIONS = 3;

export class ClarificationEngine {
  private llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  /**
   * Analyze input and determine if clarification is needed
   */
  async needsClarification(input: string): Promise<ClarificationAnalysis> {
    // Quick heuristics first
    const trimmed = input.trim();

    // Very short inputs likely need clarification
    if (trimmed.length < 10) {
      return {
        needsClarification: true,
        missingInfo: ['More details about the task'],
        ambiguities: ['Input is too brief to understand'],
        confidence: 0.3,
      };
    }

    // Use LLM for more nuanced analysis
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a task analysis assistant. Analyze the user's input and determine if clarification is needed to create a clear, actionable task.

Consider:
1. Is the task specific enough to act on?
2. Is there a clear deliverable or outcome?
3. Are there any ambiguous terms or references?
4. Is timing/deadline mentioned or implied?

Respond with JSON only.`,
      },
      {
        role: 'user',
        content: `Analyze this task input: "${input}"`,
      },
    ];

    try {
      const result = await this.llmProvider.generateJSON<{
        needsClarification: boolean;
        missingInfo: string[];
        ambiguities: string[];
        confidence: number;
      }>(
        messages,
        {
          type: 'object',
          properties: {
            needsClarification: { type: 'boolean' },
            missingInfo: { type: 'array', items: { type: 'string' } },
            ambiguities: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' },
          },
          required: ['needsClarification', 'confidence'],
        },
        { temperature: 0.3 }
      );

      return {
        needsClarification: result.needsClarification,
        missingInfo: result.missingInfo || [],
        ambiguities: result.ambiguities || [],
        confidence: Math.max(0, Math.min(1, result.confidence)),
      };
    } catch (error) {
      console.error('Clarification analysis failed:', error);
      // Default to not needing clarification on error
      return {
        needsClarification: false,
        missingInfo: [],
        ambiguities: [],
        confidence: 0.5,
      };
    }
  }

  /**
   * Generate clarifying questions (max 3)
   */
  async generateQuestions(input: string, context?: Task[]): Promise<string[]> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a helpful task assistant. Generate clarifying questions to better understand the user's task. 

Rules:
1. Ask at most ${MAX_QUESTIONS} questions
2. Questions should be specific and actionable
3. Focus on: deadline, scope, deliverables, dependencies
4. Be friendly and concise
5. Don't ask obvious questions

Respond with a JSON array of question strings.`,
      },
      {
        role: 'user',
        content: this.buildQuestionPrompt(input, context),
      },
    ];

    try {
      const result = await this.llmProvider.generateJSON<string[]>(
        messages,
        {
          type: 'array',
          items: { type: 'string' },
          maxItems: MAX_QUESTIONS,
        },
        { temperature: 0.5 }
      );

      // Ensure we don't exceed max questions
      return result.slice(0, MAX_QUESTIONS);
    } catch (error) {
      console.error('Question generation failed:', error);
      // Return default questions
      return ['When do you need this done by?', 'What would success look like for this task?'];
    }
  }

  /**
   * Process clarification response and update understanding
   */
  async processClarification(
    originalInput: string,
    question: string,
    answer: string
  ): Promise<ClarifiedInput> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a task parsing assistant. Given an original task input and a clarification Q&A, extract structured task information.

Respond with JSON containing:
- title: A clear, action-oriented task title
- description: Optional additional details
- deadline: ISO date string if mentioned (or null)
- priority: "high", "medium", or "low" based on urgency
- estimatedMinutes: Estimated time in minutes
- confidence: 0-1 how confident you are in the extraction`,
      },
      {
        role: 'user',
        content: `Original input: "${originalInput}"
Question asked: "${question}"
User's answer: "${answer}"

Extract the task information:`,
      },
    ];

    try {
      const result = await this.llmProvider.generateJSON<{
        title: string;
        description?: string;
        deadline?: string;
        priority?: PriorityLevel;
        estimatedMinutes?: number;
        confidence: number;
      }>(
        messages,
        {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            deadline: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            estimatedMinutes: { type: 'number' },
            confidence: { type: 'number' },
          },
          required: ['title', 'confidence'],
        },
        { temperature: 0.3 }
      );

      return {
        title: result.title,
        description: result.description,
        deadline: result.deadline ? new Date(result.deadline) : undefined,
        priority: result.priority,
        estimatedMinutes: result.estimatedMinutes,
        confidence: Math.max(0, Math.min(1, result.confidence)),
      };
    } catch (error) {
      console.error('Clarification processing failed:', error);
      // Return basic extraction
      return {
        title: originalInput.slice(0, 100),
        confidence: 0.3,
      };
    }
  }

  /**
   * Confirm understood task with user
   */
  formatConfirmation(clarified: ClarifiedInput): string {
    let confirmation = `Got it! Here's what I understood:\n\n`;
    confirmation += `📋 **${clarified.title}**\n`;

    if (clarified.description) {
      confirmation += `\n${clarified.description}\n`;
    }

    if (clarified.deadline) {
      confirmation += `\n⏰ Due: ${clarified.deadline.toLocaleDateString()}\n`;
    }

    if (clarified.estimatedMinutes) {
      confirmation += `\n⏱️ Estimated: ${clarified.estimatedMinutes} minutes\n`;
    }

    if (clarified.priority) {
      const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' };
      confirmation += `\n${priorityEmoji[clarified.priority]} Priority: ${clarified.priority}\n`;
    }

    confirmation += `\nDoes this look right?`;

    return confirmation;
  }

  private buildQuestionPrompt(input: string, context?: Task[]): string {
    let prompt = `Task input: "${input}"`;

    if (context && context.length > 0) {
      prompt += `\n\nExisting related tasks:\n`;
      context.slice(0, 5).forEach((t) => {
        prompt += `- ${t.title}\n`;
      });
    }

    prompt += `\n\nGenerate clarifying questions:`;
    return prompt;
  }
}
