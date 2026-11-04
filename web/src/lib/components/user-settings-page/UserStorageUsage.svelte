<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { Field, Input } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let used = $derived(getByteUnitString(authManager.user.quotaUsageInBytes ?? 0, $locale));
  let value = $derived(
    authManager.user.quotaSizeInBytes === null
      ? used
      : $t('storage_used_of', {
          values: { used, available: getByteUnitString(authManager.user.quotaSizeInBytes, $locale) },
        }),
  );
</script>

<Field label={$t('storage_used')} disabled>
  <Input {value} data-testid="storage-used" />
</Field>
