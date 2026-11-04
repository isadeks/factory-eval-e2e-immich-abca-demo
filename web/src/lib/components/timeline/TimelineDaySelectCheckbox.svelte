<script lang="ts">
  import { t } from 'svelte-i18n';

  type Props = {
    checked: boolean;
    onToggle: () => void;
  };

  let { checked, onToggle }: Props = $props();
</script>

<input
  type="checkbox"
  class="size-5 shrink-0 cursor-pointer accent-primary"
  aria-label={$t('select_all_in_day')}
  title={$t('select_all_in_day')}
  {checked}
  onchange={() => onToggle()}
/>
