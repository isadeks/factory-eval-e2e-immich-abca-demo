<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let capsLockOn = $state(false);

  const update = (event: KeyboardEvent) => {
    if (typeof event.getModifierState === 'function') {
      capsLockOn = event.getModifierState('CapsLock');
    }
  };
</script>

<!-- keyboard events bubble up from the wrapped input; this wrapper is not interactive itself -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col gap-1" onkeydown={update} onkeyup={update} onfocusout={() => (capsLockOn = false)}>
  {@render children()}
  {#if capsLockOn}
    <p class="text-sm text-warning" role="status" data-testid="caps-lock-warning">{$t('caps_lock_is_on')}</p>
  {/if}
</div>
