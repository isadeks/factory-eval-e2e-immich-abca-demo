<script lang="ts">
  import { parseDateInputValue } from '$lib/utils/timeline-jump';
  import type { TimelineYearMonth } from '$lib/utils/timeline-util';
  import { Button } from '@immich/ui';
  import { mdiCalendarSearch } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onJump: (yearMonth: TimelineYearMonth) => void;
  };

  let { onJump }: Props = $props();

  let open = $state(false);
  let value = $state('');

  const onChange = () => {
    const yearMonth = parseDateInputValue(value);
    if (!yearMonth) {
      return;
    }
    onJump(yearMonth);
    open = false;
    value = '';
  };
</script>

<div class="absolute inset-e-14 top-2 z-2 flex items-center gap-2" data-testid="jump-to-date">
  {#if open}
    <input
      type="date"
      class="rounded-lg border border-gray-300 bg-subtle px-2 py-1 text-sm dark:border-gray-600 dark:text-immich-dark-fg"
      aria-label={$t('jump_to_date')}
      data-testid="jump-to-date-input"
      bind:value
      onchange={onChange}
    />
  {/if}
  <Button
    size="small"
    shape="round"
    color="secondary"
    leadingIcon={mdiCalendarSearch}
    aria-expanded={open}
    data-testid="jump-to-date-button"
    onclick={() => (open = !open)}
  >
    {$t('jump_to_date')}
  </Button>
</div>
