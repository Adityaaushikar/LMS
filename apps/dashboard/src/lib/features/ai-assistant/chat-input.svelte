<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { ChatTextarea, type MentionItem } from '@cio/ui/custom/chat-textarea';
  import { LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import SquareIcon from '@lucide/svelte/icons/square';
  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';
  import { t } from '$lib/utils/functions/translations';
  import { resolve } from '$app/paths';
  import { currentOrgPath } from '$lib/utils/store/org';

  interface Props {
    inputValue: string;
    isStreaming: boolean;
    isExhausted: boolean;
    error: Error | null | undefined;
    mentionItems: MentionItem[];
    /** Set to 'LEARNER_CAP_REACHED' | 'POOL_EXHAUSTED' | 'AI_TUTOR_DISABLED' to render the take-a-break empty state. */
    tutorBlocked?: 'LEARNER_CAP_REACHED' | 'POOL_EXHAUSTED' | 'AI_TUTOR_DISABLED' | null;
    onSend: () => void;
    onStop: () => void;
  }

  let {
    inputValue = $bindable(),
    isStreaming,
    isExhausted,
    error,
    mentionItems,
    tutorBlocked = null,
    onSend,
    onStop
  }: Props = $props();

  function tutorBlockedMessage(reason: NonNullable<typeof tutorBlocked>): string {
    if (reason === 'LEARNER_CAP_REACHED') return t.get('aiTutor.takeABreak.learnerCap');
    if (reason === 'POOL_EXHAUSTED') return t.get('aiTutor.takeABreak.poolExhausted');
    return t.get('aiTutor.takeABreak.disabled');
  }

  let chatTextareaRef: HTMLTextAreaElement | null = $state(null);
  let wasBusy = $state(false);

  $effect(() => {
    if (isStreaming) {
      wasBusy = true;
      return;
    }

    if (!wasBusy || isExhausted || !chatTextareaRef) {
      return;
    }

    wasBusy = false;

    requestAnimationFrame(() => {
      chatTextareaRef?.focus();
    });
  });

  function getTypeLabel(item: MentionItem) {
    if (item.type === 'EXERCISE') return t.get('ai_assistant.mention_exercise');
    if (item.type === 'SECTION') return t.get('ai_assistant.mention_section');

    return t.get('ai_assistant.mention_lesson');
  }

  function getUserFriendlyErrorMessage(errorMessage: string): string {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('quota exceeded') || lowerMessage.includes('rate limit')) {
      const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)/i);
      const waitSeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;

      return waitSeconds
        ? t.get('ai_assistant.error_rate_limit_with_wait', { seconds: waitSeconds })
        : t.get('ai_assistant.error_rate_limit');
    }

    if (lowerMessage.includes('context length') || lowerMessage.includes('too long')) {
      return t.get('ai_assistant.error_context_too_long');
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return t.get('ai_assistant.error_network');
    }

    return errorMessage;
  }

  const displayErrorMessage = $derived(error ? getUserFriendlyErrorMessage(error.message) : null);
</script>

{#if tutorBlocked}
  <div class="border-t px-3 py-4">
    <div class="ui:bg-muted/40 ui:text-muted-foreground rounded-md border px-3 py-3 text-sm">
      <p class="ui:text-foreground mb-1 text-sm font-medium">{$t('aiTutor.takeABreak.title')}</p>
      <p class="text-xs">{tutorBlockedMessage(tutorBlocked)}</p>
    </div>
  </div>
{:else}
  <div class="border-t px-3 pt-3 pb-1.5">
    {#if isExhausted}
      <div
        class="flex flex-col gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
      >
        <span>{$t('ai_assistant.tokens_exhausted')}</span>
        {#if $currentOrgPath !== '#'}
          <Button
            variant="outline"
            size="sm"
            href={`${resolve(`${$currentOrgPath}/settings/ai-credits`)}#buy-tokens`}
            class="w-full shrink-0 sm:w-auto"
          >
            {$t('ai_assistant.tokens_exhausted_buy_more')}
          </Button>
        {/if}
      </div>
    {:else}
      {#if displayErrorMessage}
        <div
          class="mb-2 truncate rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {displayErrorMessage}
        </div>
      {/if}

      <div class="flex items-end gap-2">
        <ChatTextarea
          bind:ref={chatTextareaRef}
          bind:value={inputValue}
          {mentionItems}
          onSubmit={onSend}
          placeholder={$t('ai_assistant.input_placeholder')}
          disabled={isStreaming}
          typeLabel={getTypeLabel}
          emptyMessage={t.get('ai_assistant.mention_no_results')}
          rows={2}
          class="flex-1"
        >
          {#snippet icon({ item })}
            {#if item.type === 'EXERCISE'}
              <ExerciseIcon size={14} />
            {:else if item.type === 'SECTION'}
              <TableOfContentsIcon size={14} />
            {:else}
              <LessonIcon size={14} />
            {/if}
          {/snippet}

          {#snippet actions()}
            <div class="flex-1"></div>

            {#if isStreaming}
              <Button size="icon" variant="outline" onclick={onStop} class="size-7 shrink-0">
                <SquareIcon size={12} />
              </Button>
            {:else}
              <Button size="sm" onclick={onSend} disabled={!inputValue.trim()} class="shrink-0">
                {$t('ai_assistant.send')}
              </Button>
            {/if}
          {/snippet}
        </ChatTextarea>
      </div>
    {/if}
  </div>
{/if}
