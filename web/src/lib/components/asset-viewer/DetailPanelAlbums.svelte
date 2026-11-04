<script lang="ts">
  import AlbumListItemDetails from '$lib/components/asset-viewer/AlbumListItemDetails.svelte';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl } from '$lib/utils';
  import { AssetMediaSize, type AlbumResponseDto } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    albums: AlbumResponseDto[];
    isTrashed?: boolean;
  }

  let { albums, isTrashed = false }: Props = $props();
</script>

{#if albums.length > 0}
  <section class="p-6 dark:text-immich-dark-fg" data-testid="detail-panel-albums">
    <div class="pb-4">
      <Text size="small" color="muted">
        {#if isTrashed}
          {$t('original_albums', { values: { count: albums.length } })}
        {:else}
          {$t('appears_in')}
        {/if}
      </Text>
    </div>
    {#each albums as album (album.id)}
      <a href={Route.viewAlbum(album)}>
        <div class="flex items-center gap-4 pt-2 hover:cursor-pointer">
          <div>
            <img
              alt={album.albumName}
              class="size-12.5 rounded-sm object-cover"
              src={album.albumThumbnailAssetId &&
                getAssetMediaUrl({ id: album.albumThumbnailAssetId, size: AssetMediaSize.Preview })}
              draggable="false"
            />
          </div>

          <div class="my-auto">
            <p class="dark:text-immich-dark-primary">{album.albumName}</p>
            <div class="flex flex-col gap-0 text-sm">
              <div>
                <AlbumListItemDetails {album} />
              </div>
            </div>
          </div>
        </div>
      </a>
    {/each}
  </section>
{/if}
