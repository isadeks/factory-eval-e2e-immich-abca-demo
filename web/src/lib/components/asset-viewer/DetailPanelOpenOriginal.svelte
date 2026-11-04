<script lang="ts">
  import { getAssetMediaUrl } from '$lib/utils';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { Icon, Link } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let href = $derived(getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Original, edited: false }));
</script>

{#if isOwner}
  <Link {href} target="_blank" rel="noopener noreferrer" class="text-sm text-primary" data-testid="open-original-link">
    <Icon icon={mdiOpenInNew} size="16" aria-hidden="true" />
    {$t('open_original')}
  </Link>
{/if}
