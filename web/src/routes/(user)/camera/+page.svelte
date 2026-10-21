<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { captureFrame } from '$lib/utils/camera';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { Button, toastManager } from '@immich/ui';
  import { mdiCamera } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let video = $state<HTMLVideoElement>();
  let stream: MediaStream | undefined;
  let ready = $state(false);
  let error = $state<string>();
  let isCapturing = $state(false);

  const stopStream = () => {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = undefined;
    ready = false;
  };

  onMount(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      error = $t('camera_not_supported');
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (!video) {
        stopStream();
        return;
      }
      video.srcObject = stream;
      await video.play();
    } catch (error_) {
      console.error('Unable to access camera', error_);
      stopStream();
      error = $t('camera_access_denied');
    }
  });

  onDestroy(stopStream);

  const handleCapture = async () => {
    if (!video || isCapturing) {
      return;
    }

    isCapturing = true;
    try {
      const file = await captureFrame(video);
      const uploaded = await fileUploadHandler({ files: [file] });
      if (uploaded.length > 0) {
        toastManager.success($t('camera_photo_uploaded'));
      }
    } catch (error_) {
      console.error('Unable to capture photo', error_);
      toastManager.danger($t('camera_capture_failed'));
    } finally {
      isCapturing = false;
    }
  };
</script>

<UserPageLayout title={data.meta.title}>
  <div class="m-auto flex w-full max-w-3xl flex-col items-center gap-4 pt-5">
    {#if error}
      <p data-testid="camera-error" class="text-center text-light-50">{error}</p>
    {/if}

    <video
      bind:this={video}
      data-testid="camera-preview"
      class="max-h-[70vh] w-full rounded-2xl bg-black"
      class:hidden={!!error}
      autoplay
      playsinline
      muted
      onplaying={() => (ready = true)}
    ></video>

    {#if !error}
      <Button
        data-testid="camera-capture-button"
        leadingIcon={mdiCamera}
        shape="round"
        size="large"
        disabled={!ready || isCapturing}
        loading={isCapturing}
        onclick={handleCapture}
      >
        {$t('camera_take_photo')}
      </Button>
    {/if}
  </div>
</UserPageLayout>
