<script lang="ts">
  import { Route } from '$lib/route';
  import { t } from 'svelte-i18n';

  interface Props {
    count: number;
  }

  let { count }: Props = $props();
</script>

<div class="flex justify-between">
  <p class="mb-4 font-medium dark:text-immich-dark-fg">
    {$t('places')}
    <span data-testid="places-count" class="ms-1 text-sm text-gray-500 dark:text-gray-400">({count})</span>
  </p>
  <a
    href={Route.places()}
    class="pe-4 text-sm font-medium hover:text-immich-primary dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
    draggable="false">{$t('view_all')}</a
  >
</div>
