import { getServerVersion } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import { Route } from '$lib/route';
import { semverToName } from '$lib/utils';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ parent, url }) => {
  await parent();

  const continueUrl = Route.continue(url.searchParams.get('continue'), Route.photos());

  if (authManager.authenticated) {
    redirect(307, continueUrl);
  }

  if (!serverConfigManager.value.isInitialized) {
    // Admin not registered
    redirect(307, Route.register());
  }

  let serverVersion: string | undefined;
  try {
    serverVersion = semverToName(await getServerVersion());
  } catch (error) {
    console.error('Error [login-page] [getServerVersion]', error);
  }

  const $t = await getFormatter();
  return {
    meta: {
      title: $t('login'),
    },
    continueUrl,
    serverVersion,
  };
}) satisfies PageLoad;
