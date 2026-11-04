<script lang="ts">
  import { IconButton } from '@immich/ui';
  import { mdiMessageAlertOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const feedbackUrl = 'https://github.com/immich-app/immich/issues/new/choose';
</script>

<IconButton
  id="feedback-button"
  shape="round"
  color="secondary"
  variant="ghost"
  size="medium"
  icon={mdiMessageAlertOutline}
  href={feedbackUrl}
  target="_blank"
  rel="noreferrer"
  aria-label={$t('send_feedback')}
/>
