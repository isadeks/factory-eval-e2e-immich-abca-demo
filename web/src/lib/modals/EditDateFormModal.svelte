<script lang="ts">
  import { Button, HStack, Modal, ModalBody, ModalFooter, type ModalSize } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    title: string;
    icon?: string;
    submitText: string;
    disabled?: boolean;
    size?: ModalSize;
    onClose: () => void;
    onSubmit: () => void;
    children: Snippet;
  }

  let { title, icon, submitText, disabled = false, size = 'small', onClose, onSubmit, children }: Props = $props();

  const formId = `edit-date-form-${Math.random().toString(36).slice(2)}`;

  const onsubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onSubmit();
  };

  const onkeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.isComposing) {
      return;
    }
    event.preventDefault();
    if (!disabled) {
      (event.currentTarget as HTMLFormElement).requestSubmit();
    }
  };
</script>

<Modal {title} {onClose} {size} {icon}>
  <ModalBody>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form {onsubmit} {onkeydown} id={formId}>
      {@render children()}
    </form>
  </ModalBody>
  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" tabindex={1} color="primary" fullWidth {disabled} form={formId}>
        {submitText}
        <span class="ms-2 text-xs font-normal opacity-60" data-testid="submit-shortcut-hint">Ctrl+Enter</span>
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
