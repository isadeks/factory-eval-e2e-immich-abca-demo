<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { getLastLogin } from '$lib/utils/last-login';
  import type { SessionResponseDto } from '@immich/sdk';
  import { Field, Input } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    sessions: SessionResponseDto[];
  }

  const { sessions }: Props = $props();

  const lastLogin = $derived(getLastLogin(sessions));
  const formatted = $derived(
    lastLogin
      ? DateTime.fromISO(lastLogin, { locale: $locale }).toLocaleString(DateTime.DATETIME_MED, { locale: $locale })
      : '',
  );
</script>

{#if lastLogin}
  <div data-testid="last-login">
    <Field label={$t('last_login')} disabled>
      <Input value={formatted} />
    </Field>
  </div>
{/if}
