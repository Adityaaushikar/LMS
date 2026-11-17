<script lang="ts">
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { Spinner } from '@cio/ui/base/spinner';
  import MessageBubble from '$features/ai-assistant/message-bubble.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { AiAssistantMessage, AiAssistantMessageMetadata } from '$features/ai-assistant/utils/types';

  interface QuickActionOption {
    key: string;
    prompt: string;
  }

  interface Props {
    messages: AiAssistantMessage[];
    isStreaming: boolean;
    isPreparing?: boolean;
    isLoadingHistory: boolean;
    isStudent: boolean;
    courseId: string;
    quickActions: QuickActionOption[];
    onQuickAction: (action: string) => void;
    onMentionClick: (route: string) => void;
  }

  let {
    messages,
    isStreaming,
    isPreparing = false,
    isLoadingHistory,
    isStudent,
    courseId,
    quickActions,
    onQuickAction,
    onMentionClick
  }: Props = $props();

  let messagesContainer: HTMLDivElement | undefined = $state();
  let lastMessageCount = $state(0);
  let lastStreamingSig = $state(0);
  let isPinnedToBottom = $state(true);

  const SCROLL_PIN_THRESHOLD = 60;

  function handleScroll() {
    if (!messagesContainer) return;

    const distanceFromBottom =
      messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    isPinnedToBottom = distanceFromBottom <= SCROLL_PIN_THRESHOLD;
  }

  const isEmpty = $derived(messages.length === 0);

  const streamingContentSig = $derived.by(() => {
    if (messages.length === 0) return 0;

    const last = messages[messages.length - 1];

    if (last.role !== 'assistant') return 0;

    let total = 0;

    for (const part of last.parts ?? []) {
      if ((part as { type?: string }).type === 'text') {
        total += ((part as { text?: string }).text ?? '').length;
      }
    }

    return total;
  });

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    requestAnimationFrame(() => {
      messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior });
    });
  }

  $effect(() => {
    if (!messagesContainer || messages.length === 0) return;

    if (messages.length === lastMessageCount) return;

    lastMessageCount = messages.length;
    isPinnedToBottom = true;
    scrollToBottom();
  });

  $effect(() => {
    if (!messagesContainer) return;

    if (streamingContentSig === lastStreamingSig) return;

    lastStreamingSig = streamingContentSig;

    if (!isPinnedToBottom) return;

    scrollToBottom('auto');
  });
</script>

{#snippet loadingBubble(label?: string)}
  <div class="flex items-start" data-testid="ai-chat-loading" aria-live="polite">
    <div class="ui:bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
      <LoaderIcon size={16} class="ui:text-muted-foreground animate-spin" />
      {#if label}
        <span class="ui:text-muted-foreground text-xs">{label}</span>
      {/if}
    </div>
  </div>
{/snippet}

<div class="flex-1 overflow-y-auto p-4" bind:this={messagesContainer} onscroll={handleScroll}>
  {#if isLoadingHistory}
    <div class="flex h-full items-center justify-center">
      <Spinner class="ui:text-muted-foreground size-6" />
    </div>
  {:else if isEmpty}
    {#if isPreparing || isStreaming}
      <div class="flex h-full items-center justify-center">
        {@render loadingBubble(isPreparing ? $t('ai_assistant.plan_thinking') : undefined)}
      </div>
    {:else}
      <div class="flex h-full flex-col items-center justify-center gap-4">
        <div class="flex flex-col items-center gap-2 text-center">
          <SparklesIcon size={32} class="ui:text-muted-foreground" />
          <p class="ui:text-muted-foreground text-sm">
            {$t(isStudent ? 'ai_assistant.student_empty_state' : 'ai_assistant.empty_state')}
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-2">
          {#each quickActions as option (option.key)}
            <button
              onclick={() => onQuickAction(option.prompt)}
              class="ui:text-muted-foreground ui:hover:bg-muted cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors"
            >
              {$t(option.key)}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <div class="flex flex-col gap-3">
      {#each messages as message, messageIndex (message.id)}
        {@const compaction = (message.metadata as AiAssistantMessageMetadata | undefined)?.compaction}
        {@const isLast = messageIndex === messages.length - 1}

        {#if compaction}
          <p class="ui:text-muted-foreground mx-1 px-2 text-[11px] leading-snug">
            {$t('ai_assistant.context_compacted_badge', { count: compaction.originalMessageCount })}
          </p>
        {/if}

        <MessageBubble
          {message}
          {courseId}
          {isStreaming}
          {isLast}
          {onMentionClick}
        />
      {/each}

      {#if isPreparing || isStreaming}
        {@render loadingBubble(isPreparing ? $t('ai_assistant.plan_thinking') : undefined)}
      {/if}
    </div>
  {/if}
</div>
