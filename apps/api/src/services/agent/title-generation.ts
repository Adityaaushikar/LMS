import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { AIProvider, type AIProviderConfig, createModel } from '@cio/ai-assistant';

/**
 * Cheap models used specifically for title generation to minimize token cost.
 */
const TITLE_MODELS: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.ANTHROPIC]: 'claude-haiku-4-5-20251001',
  [AIProvider.GOOGLE]: 'gemini-3.1-flash-lite',
  [AIProvider.MOONSHOT]: 'kimi-k2.6'
};

function createTitleModel(config: AIProviderConfig) {
  return createModel({ ...config, model: TITLE_MODELS[config.provider] });
}

/**
 * Generates a short conversational title from the user's first message.
 * Uses the cheapest available model to minimize token cost.
 */
export async function generateConversationTitle(
  firstMessageText: string,
  providerConfig: AIProviderConfig
): Promise<string> {
  const model = createTitleModel(providerConfig);

  const systemPrompt =
    "Generate a short, descriptive title (2–5 words) for a chat conversation based on the user's first message. The title must be at least 2 words — never a single word. Return ONLY the title, no quotes, no punctuation at the end.";

  const truncatedMessage = firstMessageText.slice(0, 1000);

  // Gemini 3.x counts thinking toward maxOutputTokens; disable thinking and allow headroom for the title text.
  const { text } = await generateText(
    providerConfig.provider === AIProvider.GOOGLE
      ? {
          model,
          system: systemPrompt,
          prompt: truncatedMessage,
          maxOutputTokens: 256,
          maxRetries: 0,
          providerOptions: {
            google: { thinkingConfig: { thinkingBudget: 0 } }
          }
        }
      : {
          model,
          system: systemPrompt,
          prompt: truncatedMessage,
          maxOutputTokens: 96,
          maxRetries: 0
        }
  );

  return text.trim().slice(0, 80);
}
