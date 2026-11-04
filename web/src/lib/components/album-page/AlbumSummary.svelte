<script lang="ts">
  import { dateFormats } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { getAlbumDateRange } from '$lib/utils/date-time';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
  }

  let { album }: Props = $props();

  const lastModified = $derived(new Date(album.updatedAt).toLocaleDateString($locale, dateFormats.album));
</script>

<span class="my-2 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
  <span>{getAlbumDateRange(album)}</span>
  <span>•</span>
  <span>{$t('items_count', { values: { count: album.assetCount } })}</span>
  <span>•</span>
  <span data-testid="album-last-modified">
    {$t('album_last_modified')}
    <time datetime={album.updatedAt}>{lastModified}</time>
  </span>
</span>
