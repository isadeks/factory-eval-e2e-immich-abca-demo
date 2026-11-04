<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiHeart } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<div
  class="dark pointer-events-none absolute inset-s-16 top-4 z-1 flex size-8 items-center justify-center rounded-full bg-black/40 text-[#ff69b4] drop-shadow-[0_0_1px_rgba(0,0,0,0.4)]"
  data-testid="asset-viewer-favorite-badge"
  role="img"
  aria-label={$t('favorite')}
  title={$t('favorite')}
>
  <Icon icon={mdiHeart} size="20" aria-hidden />
</div>
