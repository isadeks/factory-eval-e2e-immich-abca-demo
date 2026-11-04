<script lang="ts">
  import { Card, CardBody, CardHeader, Heading, immichLogo, Logo, VStack } from '@immich/ui';
  import type { Snippet } from 'svelte';
  interface Props {
    title?: string;
    children?: Snippet;
    withHeader?: boolean;
    withBackdrop?: boolean;
    /** `stacked` shows the logo above the product name (wordmark) instead of the icon followed by the title. */
    logoVariant?: 'icon' | 'stacked';
  }

  let { title, children, withHeader = true, withBackdrop = true, logoVariant = 'icon' }: Props = $props();
</script>

<section class="relative isolate flex min-h-dvh min-w-dvw items-center justify-center">
  {#if withBackdrop}
    <div class="absolute -z-10 flex size-full place-content-center place-items-center">
      <img
        src={immichLogo}
        class="mx-auto mb-2 h-full max-w-(--breakpoint-md) overflow-hidden antialiased"
        alt="Immich logo"
      />
      <div
        class="absolute inset-s-0 top-0 h-[99%] w-full bg-transparent backdrop-blur-[200px] dark:bg-immich-dark-bg/20"
      ></div>
    </div>
  {/if}

  <Card color="secondary" class="m-2 w-full max-w-xl border">
    {#if withHeader}
      <CardHeader class="mt-6">
        <VStack>
          {#if logoVariant === 'stacked'}
            <Logo variant="stacked" size="landing" class="mx-auto h-[12.8rem]" />
            <Heading size="large" class="sr-only" tag="h1">{title}</Heading>
          {:else}
            <Logo variant="icon" size="giant" />
            <Heading size="large" class="font-semibold" color="primary" tag="h1">{title}</Heading>
          {/if}
        </VStack>
      </CardHeader>
    {/if}

    <CardBody class="p-8">
      {@render children?.()}
    </CardBody>
  </Card>
</section>
