<script lang="ts">
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    count: number;
  }

  let { count }: Props = $props();
</script>

<Text size="small" class="mb-2 font-medium" data-testid="duplicates-count">
  {$t('duplicates_count', { values: { count } })}
</Text>
