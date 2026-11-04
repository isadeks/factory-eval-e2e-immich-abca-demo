<script lang="ts">
  import { IconButton } from '@immich/ui';
  import { mdiArrowUp } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    /** current scroll offset of the timeline, in px */
    scrollTop: number;
    /** height of the visible timeline area, in px */
    viewportHeight: number;
    onclick: () => void;
  }

  let { scrollTop, viewportHeight, onclick }: Props = $props();

  // only show the button once the user has scrolled down more than one screen
  const visible = $derived(viewportHeight > 0 && scrollTop > viewportHeight);
</script>

{#if visible}
  <div class="fixed inset-e-24 bottom-6 z-10" transition:fade={{ duration: 150 }}>
    <IconButton
      shape="round"
      color="primary"
      class="shadow-lg"
      icon={mdiArrowUp}
      aria-label={$t('back_to_top')}
      data-testid="back-to-top-button"
      {onclick}
    />
  </div>
{/if}
