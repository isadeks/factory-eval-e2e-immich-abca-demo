<script lang="ts">
  import { t } from 'svelte-i18n';

  interface Props {
    count: number;
  }

  let { count }: Props = $props();
</script>

<p class="mb-4 font-medium dark:text-immich-dark-fg" data-testid="explore-people-heading">
  {$t('people')}
  <span class="text-sm font-normal text-gray-500 dark:text-gray-400" data-testid="explore-people-count">({count})</span>
</p>
