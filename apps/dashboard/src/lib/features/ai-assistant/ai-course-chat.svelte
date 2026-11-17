<script lang="ts">
  import { tick } from 'svelte';
  import ChatHeader from '$features/ai-assistant/chat-header.svelte';
  import ChatMessageList from '$features/ai-assistant/chat-message-list.svelte';
  import ChatInput from '$features/ai-assistant/chat-input.svelte';
  import { resolve } from '$app/paths';
  import {
    chatDraft,
    clearChatDraft,
    initialChatPrompt,
    clearInitialChatPrompt
  } from '$features/ai-assistant/utils/store';
  import { get } from 'svelte/store';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';
  import { courseApi } from '$features/course/api';
  import { getMentionableContent } from '$features/course/utils/content';
  import { getRequestBaseUrl, apiClient } from '$lib/utils/services/api';
  import { t } from '$lib/utils/functions/translations';
  import { aiAssistantApi } from '$features/ai-assistant/api/ai-assistant.svelte';
  import type { AiAssistantMessage } from '$features/ai-assistant/utils/types';
  import { STUDENT_QUICK_ACTION_ENTRIES } from '$features/ai-assistant/utils/constants';

  const courseId = $derived(page.params?.id as string);

  let inputValue = $state('');
  let statusFetchedForCourseId: string | null = $state(null);
  let conversationsLoadedForCourseId: string | null = $state(null);
  let activeConversationId: string | null = $state(null);
  let isLoadingHistory = $state(false);
  let isPreparingPrompt = $state(false);

  const tokenUsage = $derived(aiAssistantApi.status?.usage ?? null);

  function getStorageKey(id: string) {
    return `ai-chat-active-${id}`;
  }

  function getActiveConversationId(id: string): string | null {
    try {
      return localStorage.getItem(getStorageKey(id));
    } catch {
      return null;
    }
  }

  function setActiveConversationId(id: string, conversationId: string | null) {
    activeConversationId = conversationId;

    try {
      if (conversationId) {
        localStorage.setItem(getStorageKey(id), conversationId);
      } else {
        localStorage.removeItem(getStorageKey(id));
      }
    } catch {
      // localStorage unavailable
    }
  }

  let pendingLoadId: string | null = null;

  async function loadConversation(conversationId: string) {
    if (!courseId) return;

    pendingLoadId = conversationId;
    await aiAssistantApi.loadConversation(conversationId);

    if (pendingLoadId !== conversationId) {
      return;
    }

    const conversation = aiAssistantApi.currentConversation;

    if (!conversation) {
      return;
    }

    if (chat.status === 'streaming' || chat.status === 'submitted') {
      return;
    }

    const loadedMessages = (conversation.messages ?? []) as AiAssistantMessage[];

    if (loadedMessages.length > 0) {
      chat.messages = loadedMessages;
    }

    setActiveConversationId(courseId, conversationId);
  }

  async function startNewChat() {
    if (!courseId) return;

    const created = await aiAssistantApi.createConversation(courseId);

    if (created) {
      chat.messages = [];
      setActiveConversationId(courseId, created.id);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    if (!courseId) return;

    await aiAssistantApi.deleteConversation(conversationId);

    if (activeConversationId === conversationId) {
      chat.messages = [];
      setActiveConversationId(courseId, null);
    }
  }

  async function handleRenameConversation(conversationId: string, title: string) {
    const updatedTitle = await aiAssistantApi.renameConversation(conversationId, title);

    if (!updatedTitle) {
      throw new Error(aiAssistantApi.error ?? t.get('ai_assistant.rename_chat_failed'));
    }
  }

  $effect(() => {
    if (!courseId) return;

    if (statusFetchedForCourseId !== courseId) {
      statusFetchedForCourseId = courseId;
      aiAssistantApi.fetchStatus(courseId);
    }

    if (conversationsLoadedForCourseId !== courseId) {
      conversationsLoadedForCourseId = courseId;

      const pendingDraft = get(chatDraft);

      if (pendingDraft?.mode === 'new') {
        return;
      }

      const pendingPrompt = get(initialChatPrompt);

      if (pendingPrompt?.trim()) {
        return;
      }

      const listForCourseId = courseId;
      const savedId = getActiveConversationId(listForCourseId);

      isLoadingHistory = true;
      aiAssistantApi
        .listConversations(listForCourseId)
        .then(async () => {
          if (courseId !== listForCourseId) return;
          if (activeConversationId) return;
          if (chat.status === 'streaming' || chat.status === 'submitted') return;

          if (savedId) {
            await loadConversation(savedId);
          } else if (aiAssistantApi.conversations.length > 0) {
            await loadConversation(aiAssistantApi.conversations[0].id);
          }
        })
        .finally(() => {
          if (courseId === listForCourseId) {
            isLoadingHistory = false;
          }
        });
    }
  });

  async function persistFinishedChat(messages: AiAssistantMessage[], conversationId: string | null) {
    if (conversationId) {
      await aiAssistantApi.saveMessages(conversationId, messages);

      const activeConv = aiAssistantApi.conversations.find((c) => c.id === conversationId);
      const isDefaultTitle = !activeConv?.title || activeConv.title === 'New conversation';
      const firstUserMsg = messages.find((message) => message.role === 'user');
      const textPart = firstUserMsg?.parts?.find(
        (part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text'
      );

      if (isDefaultTitle && textPart?.text) {
        await aiAssistantApi.generateTitle(conversationId, textPart.text.slice(0, 500));
      }

      return;
    }

    if (!courseId) return;

    const created = await aiAssistantApi.createConversation(courseId);

    if (!created) return;

    setActiveConversationId(courseId, created.id);
    await aiAssistantApi.saveMessages(created.id, messages);

    const firstUserMsg = messages.find((message) => message.role === 'user');
    const textPart = firstUserMsg?.parts?.find(
      (part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text'
    );

    if (textPart?.text) {
      await aiAssistantApi.generateTitle(created.id, textPart.text.slice(0, 500));
    }
  }

  const chat = new Chat({
    id: 'ai-assistant',
    transport: new DefaultChatTransport({
      api: `${getRequestBaseUrl()}/agent/chat`,
      credentials: 'include',
      body: () => ({
        courseId,
        conversationId: activeConversationId ?? undefined,
        context: {
          lessonId: page.params?.lessonId,
          exerciseId: page.params?.exerciseId
        }
      }),
      fetch: (input, init) => apiClient.request(input, init)
    }),
    onFinish: () => {
      void persistFinishedChat(chat.messages as AiAssistantMessage[], activeConversationId);
      if (courseId) {
        void aiAssistantApi.fetchStatus(courseId);
      }
    }
  });

  async function ensureActiveConversation(id: string): Promise<string | null> {
    if (activeConversationId) return activeConversationId;

    const created = await aiAssistantApi.createConversation(id);

    if (!created) return null;

    setActiveConversationId(id, created.id);

    return created.id;
  }

  async function handleSend() {
    if (!inputValue.trim() || chat.status === 'streaming') return;
    if (!courseId) return;

    const text = inputValue;
    isPreparingPrompt = true;

    try {
      const conversationId = await ensureActiveConversation(courseId);
      if (!conversationId) return;

      inputValue = '';

      chat.sendMessage({ text });
    } finally {
      isPreparingPrompt = false;
    }
  }

  function handleQuickAction(action: string) {
    inputValue = action;
    void handleSend();
  }

  function handleStop() {
    chat.stop();
  }

  function handleMentionClick(route: string) {
    goto(resolve(route, {}));
  }

  const isStreaming = $derived(chat.status === 'streaming' || chat.status === 'submitted');
  const isPreparing = $derived(isPreparingPrompt || $initialChatPrompt !== null);
  const isExhausted = $derived(tokenUsage !== null && tokenUsage.remaining <= 0);

  const status = $derived(aiAssistantApi.status);
  const tutorStatus = $derived(status?.tutor);

  const tutorErrorCode = $derived.by(() => {
    if (!chat.error) return null;
    const message = chat.error.message ?? '';
    if (message.includes('AI_TUTOR_DISABLED')) return 'AI_TUTOR_DISABLED' as const;
    if (message.includes('LEARNER_CAP_REACHED')) return 'LEARNER_CAP_REACHED' as const;
    if (message.includes('POOL_EXHAUSTED')) return 'POOL_EXHAUSTED' as const;
    return null;
  });

  const tutorBlocked = $derived.by(() => {
    if (tutorErrorCode) return tutorErrorCode;
    if (tutorStatus && tutorStatus.enabled === false) return 'AI_TUTOR_DISABLED' as const;
    if (tutorStatus && tutorStatus.enforced && tutorStatus.capRemaining !== null && tutorStatus.capRemaining <= 0) {
      return 'LEARNER_CAP_REACHED' as const;
    }
    return null;
  });

  const quickActions = $derived([...STUDENT_QUICK_ACTION_ENTRIES]);

  const studentMessageUsage = $derived.by(() => {
    if (!tutorStatus || tutorStatus.cap == null || tutorStatus.capRemaining == null) {
      return null;
    }

    return {
      used: Math.max(0, tutorStatus.cap - tutorStatus.capRemaining),
      cap: tutorStatus.cap
    };
  });

  const mentionItems = $derived(
    getMentionableContent(courseApi.course).map((item) => ({
      id: item.id,
      label: item.title,
      type: item.type
    }))
  );

  const conversationTitle = $derived(
    aiAssistantApi.conversations.find((c) => c.id === activeConversationId)?.title ?? null
  );

  $effect(() => {
    const prompt = $initialChatPrompt;

    if (!prompt || !courseId) return;

    isPreparingPrompt = true;
    clearInitialChatPrompt();

    tick().then(() => {
      inputValue = prompt;
      void handleSend();
    });
  });

  $effect(() => {
    const draft = $chatDraft;

    if (!draft || !draft.text) {
      return;
    }

    clearChatDraft();

    if (draft.mode === 'new') {
      void startNewChat().then(() =>
        tick().then(() => {
          inputValue = `${draft.text}\n\n`;
        })
      );

      return;
    }

    void tick().then(() => {
      const existing = inputValue.trimEnd();

      inputValue = existing ? `${draft.text}\n\n${existing}` : `${draft.text}\n\n`;
    });
  });
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <ChatHeader
    {tokenUsage}
    isStudent={true}
    {studentMessageUsage}
    {conversationTitle}
    conversations={aiAssistantApi.conversations}
    {activeConversationId}
    isNewChatDisabled={chat.messages.length === 0}
    onNewChat={startNewChat}
    onLoadConversation={loadConversation}
    onDeleteConversation={handleDeleteConversation}
    onRenameConversation={handleRenameConversation}
  />

  <ChatMessageList
    messages={chat.messages}
    {isStreaming}
    {isPreparing}
    {isLoadingHistory}
    isStudent={true}
    {courseId}
    {quickActions}
    onQuickAction={handleQuickAction}
    onMentionClick={handleMentionClick}
  />

  <ChatInput
    bind:inputValue
    {isStreaming}
    {isExhausted}
    {mentionItems}
    {tutorBlocked}
    error={chat.error}
    onSend={handleSend}
    onStop={handleStop}
  />
</div>
