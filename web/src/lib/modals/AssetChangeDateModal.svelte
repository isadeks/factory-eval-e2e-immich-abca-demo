<script lang="ts">
  import Combobox from '$lib/components/shared-components/Combobox.svelte';
  import DateInput from '$lib/elements/DateInput.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getPreferredTimeZone, getTimezones, toIsoDate } from '$lib/modals/timezone-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset } from '@immich/sdk';
  import { FormModal, Label } from '@immich/ui';
  import { mdiCalendarEdit } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    initialDate?: DateTime;
    initialTimeZone?: string;
    timezoneInput?: boolean;
    asset: TimelineAsset;
    onClose: (success: boolean) => void;
  }

  let { initialDate = DateTime.now(), initialTimeZone, timezoneInput = true, asset, onClose }: Props = $props();

  // svelte-ignore state_referenced_locally
  const originalDate = initialDate.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");
  // svelte-ignore state_referenced_locally
  const originalOption = getPreferredTimeZone(initialDate, initialTimeZone, getTimezones(originalDate));

  let selectedDate = $state(originalDate);
  const timezones = $derived(getTimezones(selectedDate));

  let selectedOption = $state(originalOption);

  const isDateChanged = $derived(selectedDate !== originalDate);
  const isTimeZoneChanged = $derived(selectedOption?.value !== originalOption.value);

  const onSubmit = async () => {
    if (!date.isValid || !selectedOption) {
      onClose(false);
      return;
    }

    // Get the local date/time components from the selected string using neutral timezone
    const isoDate = toIsoDate(selectedDate, selectedOption);
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { dateTimeOriginal: isoDate } });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_date'));
      onClose(false);
    }
  };

  const updateSelectedDate = (value: string) => {
    selectedDate = value;

    selectedOption = getPreferredTimeZone(initialDate, initialTimeZone, getTimezones(value), selectedOption);
  };

  const resetDate = () => updateSelectedDate(originalDate);
  const resetTimeZone = () => (selectedOption = originalOption);

  // when changing the time zone, assume the configured date/time is meant for that time zone (instead of updating it)
  const date = $derived(DateTime.fromISO(selectedDate, { zone: selectedOption?.value, setZone: true }));
</script>

<FormModal
  title={$t('edit_date_and_time')}
  icon={mdiCalendarEdit}
  onClose={() => onClose(false)}
  {onSubmit}
  submitText={$t('confirm')}
  disabled={!date.isValid || !selectedOption}
  size="small"
>
  <div class="mb-1 flex items-center justify-between">
    <Label for="datetime">{$t('date_and_time')}</Label>
    {#if isDateChanged}
      <button
        type="button"
        class="text-xs text-primary hover:underline"
        data-testid="reset-date-button"
        aria-label={$t('reset_to_original_value')}
        title={$t('reset_to_original_value')}
        onclick={resetDate}
      >
        {$t('reset')}
      </button>
    {/if}
  </div>
  <DateInput
    class={`mb-2 immich-form-input w-full ${isDateChanged ? 'bg-green-100! dark:bg-green-900/40!' : ''}`}
    id="datetime"
    type="datetime-local"
    bind:value={() => selectedDate, updateSelectedDate}
  />
  {#if timezoneInput}
    <div class={['relative w-full', isTimeZoneChanged && '[&_input]:bg-green-100! dark:[&_input]:bg-green-900/40!']}>
      <Combobox bind:selectedOption label={$t('timezone')} options={timezones} placeholder={$t('search_timezone')} />
      {#if isTimeZoneChanged}
        <button
          type="button"
          class="absolute inset-e-0 top-0 text-xs text-primary hover:underline"
          data-testid="reset-timezone-button"
          aria-label={$t('reset_to_original_value')}
          title={$t('reset_to_original_value')}
          onclick={resetTimeZone}
        >
          {$t('reset')}
        </button>
      {/if}
    </div>
  {/if}
</FormModal>
