<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';

  type Props = {
    count: number;
  };

  let { count }: Props = $props();
</script>

<span data-testid="library-asset-count">{count.toLocaleString($locale)}</span>
