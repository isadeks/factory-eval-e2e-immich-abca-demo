<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { Button, Modal, ModalBody, ModalFooter, Text, Textarea } from '@immich/ui';
  import { mdiCheck, mdiContentCopy, mdiKeyVariant } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    secret?: string;
    onClose: () => void;
  };

  let { secret = '', onClose }: Props = $props();

  let copied = $state(false);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => clearTimeout(timeout));

  const handleCopy = async () => {
    if (!(await copyToClipboard(secret))) {
      return;
    }

    copied = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => (copied = false), 3000);
  };
</script>

<Modal title={$t('api_key')} icon={mdiKeyVariant} {onClose} size="small">
  <ModalBody>
    <Text size="small" class="mb-4">{$t('api_key_description')}</Text>
    <div class="flex items-start gap-2">
      <Textarea bind:value={secret} readonly class="font-mono" />
      <Button
        shape="round"
        color="secondary"
        leadingIcon={copied ? mdiCheck : mdiContentCopy}
        onclick={handleCopy}
        data-testid="api-key-copy-button"
      >
        {copied ? $t('copied') : $t('copy')}
      </Button>
    </div>
  </ModalBody>

  <ModalFooter>
    <Button shape="round" onclick={onClose} fullWidth>{$t('done')}</Button>
  </ModalFooter>
</Modal>
