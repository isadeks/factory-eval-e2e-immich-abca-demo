<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { canvasToFile } from '$lib/utils/camera';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { Button, toastManager } from '@immich/ui';
  import { mdiCamera } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let video: HTMLVideoElement | undefined = $state();
  let stream: MediaStream | undefined;
  let ready = $state(false);
  let error = $state(false);
  let isUploading = $state(false);

  const stopStream = () => {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = undefined;
    ready = false;
  };

  const startStream = async () => {
    error = false;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available');
      }
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      ready = true;
    } catch {
      stopStream();
      error = true;
    }
  };

  const handleTakePicture = async () => {
    if (!video || !ready || isUploading) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context || canvas.width === 0 || canvas.height === 0) {
      toastManager.danger($t('camera_capture_failed'));
      return;
    }

    isUploading = true;
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const file = await canvasToFile(canvas);
      const ids = await fileUploadHandler({ files: [file] });
      if (ids.length > 0) {
        toastManager.success($t('camera_picture_uploaded'));
      }
    } catch {
      toastManager.danger($t('camera_capture_failed'));
    } finally {
      isUploading = false;
    }
  };

  onMount(() => void startStream());
  onDestroy(() => stopStream());
</script>

<UserPageLayout title={data.meta.title}>
  <div class="m-auto mt-5 flex w-full max-w-3xl flex-col items-center gap-4">
    {#if error}
      <p class="text-center text-light-700" role="alert" data-testid="camera-error">{$t('camera_unavailable')}</p>
      <Button onclick={startStream}>{$t('camera_try_again')}</Button>
    {/if}

    <video
      bind:this={video}
      class="max-h-[60vh] w-full rounded-2xl bg-black object-contain"
      class:hidden={error}
      data-testid="camera-preview"
      autoplay
      playsinline
      muted
    ></video>

    {#if !error}
      <Button
        shape="round"
        size="large"
        leadingIcon={mdiCamera}
        disabled={!ready || isUploading}
        loading={isUploading}
        onclick={handleTakePicture}
      >
        {$t('camera_take_picture')}
      </Button>
    {/if}
  </div>
</UserPageLayout>
