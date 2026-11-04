<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { type AssetResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiHeart } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    asset: AssetResponseDto;
  };

  const { asset }: Props = $props();

  const favoritedAt = $derived(asset.isFavorite && asset.favoritedAt ? DateTime.fromISO(asset.favoritedAt) : undefined);
</script>

{#if favoritedAt?.isValid}
  <div class="flex gap-4 py-4" data-testid="detail-panel-favorited-at">
    <div><Icon icon={mdiHeart} size="24" /></div>
    <div>
      <p>{favoritedAt.toLocaleString(DateTime.DATETIME_MED, { locale: $locale })}</p>
      <p class="text-sm">{$t('favorited')}</p>
    </div>
  </div>
{/if}
