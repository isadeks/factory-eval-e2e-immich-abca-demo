<script lang="ts" module>
  import { getAssetInfo } from '@immich/sdk';
  import { SvelteMap } from 'svelte/reactivity';

  const deletedAtCache = new SvelteMap<string, Promise<string | null>>();

  const loadDeletedAt = (id: string) => {
    let promise = deletedAtCache.get(id);
    if (!promise) {
      promise = getAssetInfo({ id })
        .then((asset) => asset.deletedAt ?? null)
        .catch(() => {
          deletedAtCache.delete(id);
          return null;
        });
      deletedAtCache.set(id, promise);
    }
    return promise;
  };
</script>

<script lang="ts">
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { getDaysUntilPermanentDeletion } from '$lib/utils/trash';
  import { t } from 'svelte-i18n';

  type Props = {
    assetId: string;
  };

  let { assetId }: Props = $props();

  let deletedAt = $state<string | null>(null);

  $effect(() => {
    const id = assetId;
    deletedAt = null;
    void loadDeletedAt(id).then((value) => {
      if (id === assetId) {
        deletedAt = value;
      }
    });
  });

  const days = $derived(
    deletedAt === null ? null : getDaysUntilPermanentDeletion(deletedAt, serverConfigManager.value.trashDays),
  );
</script>

{#if days !== null}
  <div class="absolute inset-s-1 top-1 z-2 max-w-[90%]" data-testid="trash-retention-badge">
    <p class="truncate rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
      {$t('deletes_in_days', { values: { days } })}
    </p>
  </div>
{/if}
