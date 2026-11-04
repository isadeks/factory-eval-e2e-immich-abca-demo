<script lang="ts">
  import { type AssetResponseDto } from '@immich/sdk';
  import { Icon, Text } from '@immich/ui';
  import { mdiBookshelf } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    asset: AssetResponseDto;
    isOwner: boolean;
  };

  const { asset, isOwner }: Props = $props();
</script>

{#if isOwner && asset.libraryId}
  <div class="flex gap-4 py-4" data-testid="detail-panel-library">
    <div><Icon icon={mdiBookshelf} size="24" /></div>

    <div>
      <Text size="small" color="muted">{$t('library')}</Text>
      <p class="text-sm break-all whitespace-pre-wrap" data-testid="detail-panel-library-path">
        {asset.originalPath}
      </p>
    </div>
  </div>
{/if}
