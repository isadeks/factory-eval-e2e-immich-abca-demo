<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import ServerStatisticsPanel from './ServerStatisticsPanel.svelte';
  import ServerUptime from './ServerUptime.svelte';
  import { getServerStatistics, getServerUptime, type ServerStatsResponseDto } from '@immich/sdk';
  import { Container } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  let stats = $state<ServerStatsResponseDto | undefined>(undefined);

  const statsPromise = $derived.by(() => {
    if (stats) {
      return Promise.resolve(stats);
    }
    return data.statsPromise;
  });

  let uptimeSeconds = $state<number | undefined>(undefined);

  const currentUptimeSeconds = $derived(uptimeSeconds ?? data.uptimeSeconds);

  const updateStatistics = async () => {
    const [newStats, uptime] = await Promise.all([getServerStatistics(), getServerUptime()]);
    stats = newStats;
    uptimeSeconds = uptime.uptimeSeconds;
  };

  onMount(() => {
    const interval = setInterval(() => void updateStatistics(), 5000);

    return () => clearInterval(interval);
  });
</script>

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]}>
  <Container size="large" center>
    <ServerUptime uptimeSeconds={currentUptimeSeconds} />
    <ServerStatisticsPanel {statsPromise} users={data.users} />
  </Container>
</AdminPageLayout>
