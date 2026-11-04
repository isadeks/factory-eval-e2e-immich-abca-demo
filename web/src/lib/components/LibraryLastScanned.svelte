<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    refreshedAt?: string | null;
    class?: string;
  };

  const { refreshedAt, class: className = '' }: Props = $props();

  const date = $derived(refreshedAt ? DateTime.fromISO(refreshedAt, { locale: $locale }) : undefined);
</script>

<span class={className} data-testid="library-last-scanned">
  {$t('last_scanned')}:
  {#if date?.isValid}
    <time datetime={date.toISO()} title={date.toLocaleString(DateTime.DATETIME_FULL)}>
      {date.toRelative() ?? date.toLocaleString(DateTime.DATETIME_MED)}
    </time>
  {:else}
    {$t('never')}
  {/if}
</span>
