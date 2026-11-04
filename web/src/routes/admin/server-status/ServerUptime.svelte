<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { formatUptime } from '$lib/utils/uptime';
  import { Icon, Text } from '@immich/ui';
  import { mdiClockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    uptimeSeconds?: number;
  };

  const { uptimeSeconds }: Props = $props();
</script>

<div class="flex items-center gap-3 rounded-3xl bg-subtle px-5 py-3 text-primary" data-testid="server-uptime">
  <Icon icon={mdiClockOutline} size="25" />
  <Text fontWeight="medium">{$t('server_uptime')}</Text>
  <Text class="font-mono" data-testid="server-uptime-value">
    {uptimeSeconds === undefined ? '-' : formatUptime(uptimeSeconds, $locale)}
  </Text>
</div>
