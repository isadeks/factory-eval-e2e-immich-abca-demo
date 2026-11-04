<script lang="ts">
  import { t } from 'svelte-i18n';
</script>

<div class="pointer-events-none absolute inset-0 flex items-center justify-center" data-testid="map-no-location-data">
  <p class="rounded-lg bg-subtle/80 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{$t('no_location_data')}</p>
</div>
