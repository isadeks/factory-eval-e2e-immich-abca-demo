<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumInfo } from '@immich/sdk';
  import { Textarea } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';

  interface Props {
    id: string;
    description: string;
    isOwned: boolean;
  }

  let { id, description = $bindable(), isOwned }: Props = $props();

  let paragraph = $state<HTMLParagraphElement>();
  let expanded = $state(false);
  let isClamped = $state(false);

  // While collapsed the paragraph is line-clamped, so overflow means there is more text to reveal.
  $effect(() => {
    void description;
    if (paragraph && !expanded) {
      isClamped = paragraph.scrollHeight > paragraph.clientHeight;
    }
  });

  const handleFocusOut = async () => {
    try {
      const response = await updateAlbumInfo({
        id,
        updateAlbumDto: {
          description,
        },
      });
      eventManager.emit('AlbumUpdate', response);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
    }
  };
</script>

{#if isOwned}
  <Textarea
    bind:value={description}
    variant="ghost"
    onfocusout={handleFocusOut}
    placeholder={$t('add_a_description')}
    data-testid="autogrow-textarea"
    class="max-h-32"
    {@attach fromAction(shortcut, () => ({
      shortcut: { key: 'Enter', ctrl: true },
      onShortcut: (e) => e.currentTarget.blur(),
    }))}
  />
{:else if description}
  <div class="w-full">
    <p
      bind:this={paragraph}
      data-testid="album-description"
      class="wrap-break-words w-full text-sm whitespace-pre-line dark:text-immich-dark-fg"
      class:line-clamp-3={!expanded}
    >
      {description}
    </p>
    {#if isClamped || expanded}
      <button
        type="button"
        data-testid="album-description-toggle"
        class="text-sm font-medium text-primary hover:underline"
        aria-expanded={expanded}
        onclick={() => (expanded = !expanded)}
      >
        {expanded ? $t('show_less') : $t('show_more')}
      </button>
    {/if}
  </div>
{/if}
