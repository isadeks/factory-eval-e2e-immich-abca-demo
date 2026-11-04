<script lang="ts">
  import { TimelineGridSize, timelineGridSize } from '$lib/stores/preferences.store';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';

  const options = $derived([
    { size: TimelineGridSize.Small, label: $t('grid_size_small') },
    { size: TimelineGridSize.Medium, label: $t('grid_size_medium') },
    { size: TimelineGridSize.Large, label: $t('grid_size_large') },
  ]);
</script>

<div
  class="flex items-center justify-end gap-1 pe-2 pb-2"
  role="group"
  aria-label={$t('grid_size')}
  data-testid="timeline-grid-size"
>
  {#each options as { size, label } (size)}
    <Button
      size="small"
      variant={$timelineGridSize === size ? 'filled' : 'ghost'}
      color={$timelineGridSize === size ? 'primary' : 'secondary'}
      aria-pressed={$timelineGridSize === size}
      onclick={() => ($timelineGridSize = size)}
    >
      {label}
    </Button>
  {/each}
</div>
