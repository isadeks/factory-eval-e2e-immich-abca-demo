import { getServerStatistics, getServerUptime, searchUsersAdmin } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const statsPromise = getServerStatistics();
  const { uptimeSeconds } = await getServerUptime();
  const users = await searchUsersAdmin({ withDeleted: false });
  const $t = await getFormatter();

  return {
    statsPromise,
    uptimeSeconds,
    users,
    meta: {
      title: $t('server_stats'),
    },
  };
}) satisfies PageLoad;
