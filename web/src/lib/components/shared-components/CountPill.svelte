<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';

  type Props = {
    count: number;
    testId?: string;
  };

  let { count, testId = 'count-pill' }: Props = $props();
</script>

<span
  data-testid={testId}
  class="inline-flex h-min items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs leading-none font-medium whitespace-nowrap text-gray-600 dark:bg-gray-700 dark:text-gray-300"
>
  {count.toLocaleString($locale)}
</span>
