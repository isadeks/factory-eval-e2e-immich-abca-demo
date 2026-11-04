<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiHeartOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<div
  data-testid="favorites-empty-state"
  class="mx-auto mt-10 flex flex-col items-center justify-center gap-3 p-5 text-gray-500 dark:text-gray-400"
>
  <Icon icon={mdiHeartOutline} size="4rem" aria-hidden />
  <p class="text-center text-lg font-light">{$t('no_favorites_yet')}</p>
</div>
