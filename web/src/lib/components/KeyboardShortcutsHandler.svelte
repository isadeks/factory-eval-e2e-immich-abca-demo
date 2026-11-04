<script lang="ts">
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { shortcuts } from '$lib/actions/shortcut';
  import { isModalOpen, modalManager } from '@immich/ui';

  const showShortcuts = async () => {
    if (isModalOpen()) {
      return;
    }

    await modalManager.show(ShortcutsModal, {});
  };
</script>

<svelte:document use:shortcuts={[{ shortcut: { key: '?', shift: true }, onShortcut: showShortcuts }]} />
