<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiImageOffOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    query?: string | null;
  }

  let { query }: Props = $props();

  let trimmedQuery = $derived(query?.trim());
</script>

<div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
  <div class="flex flex-col content-center items-center text-center">
    <Icon icon={mdiImageOffOutline} size="3.5em" />
    <p class="mt-5 text-3xl font-medium" data-testid="search-no-results">
      {trimmedQuery ? $t('no_results_for_query', { values: { query: trimmedQuery } }) : $t('no_results')}
    </p>
    <p class="text-base font-normal">{$t('no_results_description')}</p>
  </div>
</div>
