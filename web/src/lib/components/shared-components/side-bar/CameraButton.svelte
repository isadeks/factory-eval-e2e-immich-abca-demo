<script lang="ts">
  import CameraModal from '$lib/modals/CameraModal.svelte';
  import { Icon, modalManager } from '@immich/ui';
  import { mdiCameraOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const handleClick = async () => {
    await modalManager.show(CameraModal, {});
  };
</script>

<button
  type="button"
  data-testid="camera-button"
  class="flex w-full place-items-center gap-4 rounded-e-full py-3 ps-5 transition-[padding] delay-100 duration-100 hover:bg-subtle hover:text-primary"
  onclick={handleClick}
>
  <Icon icon={mdiCameraOutline} size="1.375em" class="shrink-0" aria-hidden />
  <span class="truncate text-sm font-medium">{$t('camera')}</span>
</button>
