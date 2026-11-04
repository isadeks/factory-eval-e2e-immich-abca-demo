<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumInfo } from '@immich/sdk';
  import { Textarea } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fromAction } from 'svelte/attachments';

  type Props = {
    id: string;
    albumName: string;
    isOwned: boolean;
    assetCount: number;
    onUpdate: (albumName: string) => void;
  };

  let { id, albumName = $bindable(), isOwned, assetCount, onUpdate }: Props = $props();

  let newAlbumName = $derived(albumName);

  const handleUpdate = async () => {
    newAlbumName = newAlbumName.replaceAll('\n', ' ').trim();

    if (newAlbumName === albumName) {
      return;
    }

    try {
      const response = await updateAlbumInfo({ id, updateAlbumDto: { albumName: newAlbumName } });
      ({ albumName } = response);
      eventManager.emit('AlbumUpdate', response);
      onUpdate(albumName);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_album'));
    }
  };

  const textClasses = 'text-2xl lg:text-6xl text-primary';
</script>

<div class="mb-2 flex items-center gap-x-3">
  {#if isOwned}
    <div class="min-w-0">
      <Textarea
        bind:value={newAlbumName}
        variant="ghost"
        title={$t('edit_title')}
        onblur={handleUpdate}
        placeholder={$t('add_a_title')}
        class="{textClasses} field-sizing-content w-auto max-w-full"
        {@attach fromAction(shortcut, () => ({
          shortcut: { key: 'Enter' },
          onShortcut: (event) => event.currentTarget.blur(),
        }))}
      />
    </div>
  {:else}
    <div class="min-w-0 {textClasses}">{newAlbumName}</div>
  {/if}
  <span
    data-testid="album-asset-count"
    class="shrink-0 rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
  >
    {$t('items_count', { values: { count: assetCount } })}
  </span>
</div>
