<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import type { UserAdminResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  type Props = {
    user: Pick<UserAdminResponseDto, 'quotaSizeInBytes' | 'quotaUsageInBytes'>;
  };

  let { user }: Props = $props();

  const used = $derived(getByteUnitString(user.quotaUsageInBytes ?? 0, $locale));
  const hasQuota = $derived(user.quotaSizeInBytes !== null && user.quotaSizeInBytes >= 0);
</script>

<span data-testid="user-storage-usage">
  {#if hasQuota}
    {$t('storage_usage', { values: { used, available: getByteUnitString(user.quotaSizeInBytes ?? 0, $locale) } })}
  {:else}
    {used}
  {/if}
</span>
