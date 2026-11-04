<script lang="ts">
  import GeolocationPointPickerModal from '$lib/modals/GeolocationPointPickerModal.svelte';
  import { copyToClipboard } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { Icon, IconButton, modalManager } from '@immich/ui';
  import { mdiContentCopy, mdiCrosshairsGps, mdiMapMarkerOutline, mdiPencil } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    isOwner: boolean;
    asset: AssetResponseDto;
  };

  let { isOwner, asset = $bindable() }: Props = $props();

  const latitude = $derived(asset.exifInfo?.latitude);
  const longitude = $derived(asset.exifInfo?.longitude);
  const coordinates = $derived(
    latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined
      ? `${Number(latitude.toFixed(7))}, ${Number(longitude.toFixed(7))}`
      : undefined,
  );

  const onAction = async () => {
    const point = await modalManager.show(GeolocationPointPickerModal, { asset });
    if (!point) {
      return;
    }

    try {
      asset = await updateAsset({
        id: asset.id,
        updateAssetDto: { latitude: point.lat, longitude: point.lng },
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_location'));
    }
  };
</script>

{#if asset.exifInfo?.country}
  <button
    type="button"
    class="flex w-full place-items-start justify-between gap-4 py-4 text-start"
    onclick={isOwner ? onAction : undefined}
    title={isOwner ? $t('edit_location') : ''}
    class:hover:text-primary={isOwner}
  >
    <div class="flex gap-4">
      <div><Icon icon={mdiMapMarkerOutline} size="24" /></div>

      <div>
        {#if asset.exifInfo?.city}
          <p>{asset.exifInfo.city}</p>
        {/if}
        {#if asset.exifInfo?.state}
          <div class="flex gap-2 text-sm">
            <p>{asset.exifInfo.state}</p>
          </div>
        {/if}
        {#if asset.exifInfo?.country}
          <div class="flex gap-2 text-sm">
            <p>{asset.exifInfo.country}</p>
          </div>
        {/if}
      </div>
    </div>

    {#if isOwner}
      <div>
        <Icon icon={mdiPencil} size="20" />
      </div>
    {/if}
  </button>
{:else if !asset.exifInfo?.city && isOwner}
  <button
    type="button"
    class="flex w-full place-items-start justify-between gap-4 rounded-lg py-4 text-start hover:text-primary"
    onclick={onAction}
    title={$t('add_location')}
  >
    <div class="flex gap-4">
      <div><Icon icon={mdiMapMarkerOutline} size="24" /></div>
      <p>{$t('add_a_location')}</p>
    </div>
    <div class="p-1 focus:outline-none">
      <Icon icon={mdiPencil} size="20" />
    </div>
  </button>
{/if}

{#if coordinates}
  <div class="flex w-full place-items-center justify-between gap-4 pb-4" data-testid="detail-panel-coordinates">
    <div class="flex gap-4">
      <div><Icon icon={mdiCrosshairsGps} size="24" /></div>
      <p class="text-sm" data-testid="detail-panel-coordinates-text">{coordinates}</p>
    </div>
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      size="small"
      icon={mdiContentCopy}
      aria-label={$t('copy_coordinates')}
      title={$t('copy_coordinates')}
      data-testid="detail-panel-coordinates-copy"
      onclick={() => copyToClipboard(coordinates)}
    />
  </div>
{/if}
