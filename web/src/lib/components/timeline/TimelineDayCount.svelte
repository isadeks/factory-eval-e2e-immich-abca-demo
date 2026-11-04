<script lang="ts">
  import { t } from 'svelte-i18n';

  type Props = {
    count: number;
  };

  let { count }: Props = $props();
</script>

<span class="font-normal text-gray-500 dark:text-gray-400" data-testid="timeline-day-count">
  · {$t('photos_count', { values: { count } })}
</span>
