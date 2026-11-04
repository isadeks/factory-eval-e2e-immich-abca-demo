<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';

  interface Props {
    count: number;
  }

  let { count }: Props = $props();
</script>

<span
  data-testid="timeline-asset-count"
  class="rounded-full bg-subtle px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400"
>
  {count.toLocaleString($locale)}
</span>
