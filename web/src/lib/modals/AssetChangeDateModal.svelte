<script lang="ts">
  import Combobox from '$lib/components/shared-components/Combobox.svelte';
  import DateInput from '$lib/elements/DateInput.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getPreferredTimeZone, getTimezones, isDateTimeChanged, toIsoDate } from '$lib/modals/timezone-utils';
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
  let selectedDate = $state(originalDate);
  const timezones = $derived(getTimezones(selectedDate));

  // svelte-ignore state_referenced_locally
  const originalTimeZone = getPreferredTimeZone(initialDate, initialTimeZone, getTimezones(selectedDate));
  let selectedOption = $state(originalTimeZone);
  const isDateChanged = $derived(isDateTimeChanged(originalDate, selectedDate));
  const isTimeZoneChanged = $derived(selectedOption?.value !== originalTimeZone.value);

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
  <Label for="datetime" class="mb-1 block">{$t('date_and_time')}</Label>
  <DateInput
    class="mb-2 immich-form-input w-full {isDateChanged ? 'immich-form-input-changed' : ''}"
    data-changed={isDateChanged ? 'true' : undefined}
    id="datetime"
    type="datetime-local"
    bind:value={() => selectedDate, updateSelectedDate}
  />
  {#if timezoneInput}
    <div class="w-full">
      <Combobox
        bind:selectedOption
        label={$t('timezone')}
        options={timezones}
        placeholder={$t('search_timezone')}
        changed={isTimeZoneChanged}
      />
    </div>
  {/if}
</FormModal>
