<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  type Props = {
    person: PersonResponseDto;
    onFocus: () => void;
    onBlur: () => void;
    onInput: (event: Event) => void;
  };

  let { person, onFocus, onBlur, onInput }: Props = $props();
</script>

<!-- `title` shows the full name in a native tooltip when the name is truncated by the input width -->
<input
  type="text"
  class="mt-2 w-full rounded-2xl border-gray-100 bg-white py-2 text-center text-sm text-primary placeholder-gray-400 dark:border-gray-900 dark:bg-immich-dark-gray"
  value={person.name}
  title={person.name || undefined}
  placeholder={$t('add_a_name')}
  use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: (e) => e.currentTarget.blur() }}
  onfocusin={onFocus}
  onfocusout={onBlur}
  oninput={onInput}
/>
