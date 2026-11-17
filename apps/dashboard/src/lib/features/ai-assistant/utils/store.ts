import { writable } from 'svelte/store';
import type { AgentModelId } from '@cio/utils/agent-models';
import { sidePanel } from '$features/side-panel';

export const AI_ASSISTANT_PANEL_ID = 'ai-assistant';

export function openAiAssistant() {
  sidePanel.open(AI_ASSISTANT_PANEL_ID);
}

export function openAiAssistantFloating() {
  sidePanel.openFloating(AI_ASSISTANT_PANEL_ID);
}

export function closeAiAssistant() {
  sidePanel.close();
}

export function toggleAiAssistant() {
  sidePanel.toggle(AI_ASSISTANT_PANEL_ID);
}

export function toggleAiAssistantFloating() {
  sidePanel.toggleFloating(AI_ASSISTANT_PANEL_ID);
}

export function dockAiAssistant() {
  sidePanel.dock();
}

export const initialChatPrompt = writable<string | null>(null);
export const initialChatModel = writable<AgentModelId | null>(null);

export function setInitialChatPrompt(prompt: string) {
  initialChatPrompt.set(prompt);
}

export function setInitialChatModel(model: AgentModelId) {
  initialChatModel.set(model);
}

export function clearInitialChatPrompt() {
  initialChatPrompt.set(null);
}

export function clearInitialChatModel() {
  initialChatModel.set(null);
}

export function sendPromptToAssistant(prompt: string) {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return;
  }

  setInitialChatPrompt(trimmed);
  openAiAssistant();
}

export type ChatDraft = { text: string; mode: 'append' | 'new' };

export const chatDraft = writable<ChatDraft | null>(null);

export function clearChatDraft() {
  chatDraft.set(null);
}

export function setChatDraft(draft: ChatDraft) {
  chatDraft.set(draft);
}

function mdQuote(body: string) {
  return body
    .trim()
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

export function quoteInChat(text: string) {
  const quoted = mdQuote(text);

  if (!quoted.trim()) {
    return;
  }

  const isOpen = sidePanel.activePanelId === AI_ASSISTANT_PANEL_ID;

  chatDraft.set({ text: quoted, mode: isOpen ? 'append' : 'new' });

  if (!isOpen) {
    openAiAssistant();
  }
}
