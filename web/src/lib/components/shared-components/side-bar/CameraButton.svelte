<script lang="ts">
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { Icon } from '@immich/ui';
  import { mdiCameraOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let input = $state<HTMLInputElement>();

  const handleChange = async (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const files = Array.from(target.files ?? []);
    // reset so that taking the same picture again still triggers a change event
    target.value = '';
    if (files.length === 0) {
      return;
    }

    await fileUploadHandler({ files });
  };
</script>

<div>
  <button
    type="button"
    data-testid="camera-button"
    class="flex w-full place-items-center gap-4 rounded-e-full py-3 ps-5 transition-[padding] delay-100 duration-100 hover:bg-subtle hover:text-primary"
    onclick={() => input?.click()}
  >
    <Icon icon={mdiCameraOutline} size="1.375em" class="shrink-0" aria-hidden />
    <span class="truncate text-sm font-medium">{$t('camera')}</span>
  </button>
  <input
    bind:this={input}
    data-testid="camera-input"
    type="file"
    accept="image/*"
    capture="environment"
    hidden
    onchange={handleChange}
  />
</div>
