<script lang="ts">
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { t } from 'svelte-i18n';

  let { stats, isUploading, remainingUploads } = uploadAssetsStore;
</script>

<!-- Screen-reader-only live region; always rendered so assistive tech registers it before the text changes. -->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="upload-progress-live-region">
  {#if $isUploading}
    {$t('upload_progress', {
      values: {
        remaining: $remainingUploads,
        processed: $stats.total - $remainingUploads,
        total: $stats.total,
      },
    })}
  {/if}
</div>
