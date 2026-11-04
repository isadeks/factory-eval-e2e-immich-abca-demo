<script lang="ts">
  import { t } from 'svelte-i18n';
</script>

<div data-testid="archive-empty-state" class="flex size-full min-h-60 items-center justify-center p-10">
  <p class="text-center text-sm text-gray-500 dark:text-gray-400">{$t('nothing_archived_yet')}</p>
</div>
