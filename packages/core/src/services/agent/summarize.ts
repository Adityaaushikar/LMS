import { generateText } from 'ai';
import { createModel, pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';
import { AppError } from '@cio/utils/errors';

const SUMMARIZE_SYSTEM_PROMPT = `You are summarizing a ClassroomIO student tutoring chat so the tutor assistant can retain context across conversation turns.

Write the summary as a concise context message for the tutor assistant.
Required structure:
1. Learning topics covered: what lessons, concepts, or exercises the student asked about.
2. Questions and misconceptions: key questions asked by the student and any confusion addressed.
3. Progress & practice: any exercises or quiz questions attempted and how the student performed.
4. Next learning steps: recommendations or topics to continue with.

Keep the summary clear, accurate, and under 300 words.`;

interface InboundMessagePart {
  type: string;
  text?: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
}

interface InboundMessage {
  role: string;
  content?: string;
  parts?: InboundMessagePart[];
  metadata?: Record<string, unknown> | null | undefined;
}

export interface SummarizeOptions {
  messages: InboundMessage[];
}

export interface SummarizeDeltaOptions extends SummarizeOptions {
  existingSummary?: string | null;
}

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;

  return `${input.slice(0, max)}…`;
}

function stringifySafely(value: unknown): string {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

function partsToText(message: InboundMessage): string {
  const lines: string[] = [];

  if (message.content && message.content.trim().length > 0) {
    lines.push(message.content.trim());
  }

  for (const part of message.parts ?? []) {
    if (part.type === 'text' && part.text) {
      lines.push(part.text.trim());
      continue;
    }

    if (part.type === 'tool-invocation' || part.type?.startsWith('tool-')) {
      const toolName = part.toolName ?? (part.type.startsWith('tool-') ? part.type.slice(5) : 'unknown_tool');

      const inputText = part.input !== undefined ? truncate(stringifySafely(part.input), 600) : '';
      const outputText = part.output !== undefined ? truncate(stringifySafely(part.output), 1500) : '';

      const segments: string[] = [`[tool:${toolName}]`];

      if (inputText) {
        segments.push(`input=${inputText}`);
      }

      if (outputText) {
        segments.push(`output=${outputText}`);
      }

      lines.push(segments.join(' '));
    }
  }

  const metadataTemplate = message.metadata?.template;

  if (metadataTemplate && typeof metadataTemplate === 'object') {
    lines.push(`[template-action] ${truncate(stringifySafely(metadataTemplate), 600)}`);
  }

  return lines.join('\n');
}

const MAX_CONVERSATION_CHARS = 60_000;
const MAX_OUTPUT_TOKENS = 2_000;

export async function summarizeConversation(options: SummarizeOptions): Promise<string> {
  const providerConfig = pickAnyConfiguredProvider();

  if (!providerConfig) {
    throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);
  }

  const model = createModel(providerConfig);

  const conversationLines: string[] = [];

  for (const message of options.messages ?? []) {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    const body = partsToText(message);

    if (!body.trim()) {
      continue;
    }

    conversationLines.push(`${role}: ${body}`);
  }

  const conversationText = conversationLines.join('\n\n');

  // Prefer keeping the END of the transcript when truncating — recent context is most
  // valuable for "continue from here" continuations.
  const truncatedText =
    conversationText.length > MAX_CONVERSATION_CHARS
      ? conversationText.slice(conversationText.length - MAX_CONVERSATION_CHARS)
      : conversationText;

  const result = await generateText({
    model,
    system: SUMMARIZE_SYSTEM_PROMPT,
    prompt: `Here is the conversation to summarize. Tool calls appear as [tool:name] input=… output=… lines.\n\n${truncatedText}\n\nReturn the structured handoff message described in the system prompt.`,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    maxRetries: 0
  });

  return result.text.trim();
}

export async function summarizeConversationDelta(options: SummarizeDeltaOptions): Promise<string> {
  if (!options.existingSummary?.trim()) {
    return summarizeConversation({ messages: options.messages });
  }

  const providerConfig = pickAnyConfiguredProvider();

  if (!providerConfig) {
    throw new AppError('AI assistant is not configured', 'AI_NOT_CONFIGURED', 503);
  }

  const model = createModel(providerConfig);
  const conversationLines: string[] = [];

  for (const message of options.messages ?? []) {
    const role = message.role === 'user' ? 'User' : 'Assistant';
    const body = partsToText(message);

    if (!body.trim()) {
      continue;
    }

    conversationLines.push(`${role}: ${body}`);
  }

  const conversationText = conversationLines.join('\n\n');
  const truncatedText =
    conversationText.length > MAX_CONVERSATION_CHARS
      ? conversationText.slice(conversationText.length - MAX_CONVERSATION_CHARS)
      : conversationText;

  const result = await generateText({
    model,
    system: SUMMARIZE_SYSTEM_PROMPT,
    prompt: `Existing structured handoff summary:\n\n${options.existingSummary.trim()}\n\nNew conversation messages to merge into that summary:\n\n${truncatedText}\n\nReturn one updated structured handoff message using the required section headings. Preserve concrete plan status, template answers, fetched documentation URLs/source identifiers, created course items, open decisions, and the next action.`,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    maxRetries: 0
  });

  return result.text.trim();
}
