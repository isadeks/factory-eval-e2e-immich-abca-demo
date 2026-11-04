<script lang="ts">
  import { websocketStore } from '$lib/stores/websocket';
  import { semverToName } from '$lib/utils';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  const { serverVersion } = websocketStore;

  let version = $derived($serverVersion ? semverToName($serverVersion) : null);
</script>

{#if version}
  <Text size="small" color="muted" class="mt-8 text-center" data-testid="settings-footer-version">
    {$t('server_version')}: {version}
  </Text>
{/if}
