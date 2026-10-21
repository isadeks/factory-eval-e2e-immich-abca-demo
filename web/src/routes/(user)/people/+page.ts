import { getAllPeople, getMatchSuggestions } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const [people, suggestions] = await Promise.all([getAllPeople({ withHidden: true }), getMatchSuggestions()]);
  const $t = await getFormatter();

  return {
    people,
    suggestions,
    meta: {
      title: $t('people'),
    },
  };
}) satisfies PageLoad;
