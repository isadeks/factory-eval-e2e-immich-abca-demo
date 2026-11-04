<script lang="ts">
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    onClick?: () => unknown;
  }

  let { onClick }: Props = $props();
</script>

<div class="mx-auto mt-10 flex w-1/2 flex-col items-center gap-3">
  <EmptyPlaceholder text={$t('no_assets_message')} {onClick} fullWidth />
  <p data-testid="empty-timeline-drag-hint" class="text-sm text-gray-500 dark:text-immich-dark-fg">
    {$t('drag_photos_to_upload')}
  </p>
</div>
