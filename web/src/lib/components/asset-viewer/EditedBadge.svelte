<script lang="ts">
  import type { AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: Pick<AssetResponseDto, 'isEdited'>;
  }

  let { asset }: Props = $props();
</script>

{#if asset.isEdited}
  <span
    data-testid="edited-badge"
    class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
  >
    {$t('edited')}
  </span>
{/if}
