<script lang="ts">
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { Button, LoadingSpinner, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiCamera } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  let { onClose }: Props = $props();

  let video = $state<HTMLVideoElement>();
  let stream: MediaStream | undefined;
  let isReady = $state(false);
  let hasError = $state(false);

  const stopStream = () => {
    for (const track of stream?.getTracks() ?? []) {
      track.stop();
    }
    stream = undefined;
  };

  onMount(() => {
    let isDestroyed = false;

    const start = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (isDestroyed) {
          for (const track of mediaStream.getTracks()) {
            track.stop();
          }
          return;
        }
        stream = mediaStream;
        if (video) {
          video.srcObject = mediaStream;
        }
      } catch {
        hasError = true;
      }
    };

    void start();

    return () => {
      isDestroyed = true;
      stopStream();
    };
  });

  const takePicture = async () => {
    if (!video || !isReady) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      hasError = true;
      return;
    }

    const file = new File([blob], `camera-${new Date().toISOString().replaceAll(/[:.]/g, '-')}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    // upload right away, without waiting for it to finish
    void fileUploadHandler({ files: [file] });
    onClose();
  };
</script>

<Modal title={$t('camera')} size="medium" {onClose}>
  <ModalBody>
    {#if hasError}
      <p class="py-5 text-sm" data-testid="camera-error">{$t('unable_to_access_camera')}</p>
    {:else}
      <div class="relative flex min-h-40 items-center justify-center overflow-hidden rounded-xl bg-black">
        {#if !isReady}
          <div class="absolute"><LoadingSpinner /></div>
        {/if}
        <video
          bind:this={video}
          data-testid="camera-video"
          class="max-h-[60vh] w-full"
          autoplay
          muted
          playsinline
          onloadeddata={() => (isReady = true)}
        ></video>
      </div>
    {/if}
  </ModalBody>
  <ModalFooter>
    <Button
      shape="round"
      fullWidth
      leadingIcon={mdiCamera}
      data-testid="camera-capture"
      disabled={!isReady || hasError}
      onclick={takePicture}
    >
      {$t('take_picture')}
    </Button>
  </ModalFooter>
</Modal>
