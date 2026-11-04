<script lang="ts">
  import { TooltipProvider } from '@immich/ui';
  import type { ComponentProps } from 'svelte';
  import PeoplePage from './+page.svelte';

  interface Props {
    data: ComponentProps<typeof PeoplePage>['data'];
  }

  let { data }: Props = $props();
</script>

<TooltipProvider>
  <PeoplePage {data} />
</TooltipProvider>
