<script lang="ts">
  import Combobox from '$lib/components/shared-components/Combobox.svelte';
  import DateInput from '$lib/elements/DateInput.svelte';
  import DurationInput from '$lib/elements/DurationInput.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { getPreferredTimeZone, getTimezones, toIsoDate, type ZoneOption } from '$lib/modals/timezone-utils';
  import { getOwnedAssetsWithWarning } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAssets } from '@immich/sdk';
  import { Field, FormModal, Label, Switch } from '@immich/ui';
  import { mdiCalendarEdit } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    initialDate?: DateTime;
    initialTimeZone?: string;
    assets: TimelineAsset[];
    onClose: (success: boolean) => void;
  }
  let { initialDate = DateTime.now(), initialTimeZone, assets, onClose }: Props = $props();

  let showRelative = $state(false);
  let selectedDuration = $state(0);
  // svelte-ignore state_referenced_locally
  const originalDate = initialDate.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");
  // svelte-ignore state_referenced_locally
  const originalOption = getPreferredTimeZone(initialDate, initialTimeZone, getTimezones(originalDate));
  let selectedDate = $state(originalDate);
  const timezones = $derived(getTimezones(selectedDate));
  let lastSelectedTimezone = $state(originalOption);
  // the offsets (and validity) for time zones may change if the date is changed, which is why we recompute the list
  let selectedOption = $derived(getPreferredTimeZone(initialDate, initialTimeZone, timezones, lastSelectedTimezone));

  const isDateChanged = $derived(selectedDate !== originalDate);
  const isTimeZoneChanged = $derived(selectedOption?.value !== originalOption.value);

  const resetDate = () => (selectedDate = originalDate);
  const resetTimeZone = () => (lastSelectedTimezone = originalOption);

  const onSubmit = async () => {
    const ids = getOwnedAssetsWithWarning(assets, authManager.user);
    try {
      if (showRelative && (selectedDuration || selectedOption)) {
        await updateAssets({
          assetBulkUpdateDto: {
            ids,
            dateTimeRelative: selectedDuration,
            timeZone: selectedOption?.value,
          },
        });
        onClose(true);
        return;
      }
      const isoDate = toIsoDate(selectedDate, selectedOption);
      await updateAssets({ assetBulkUpdateDto: { ids, dateTimeOriginal: isoDate } });
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_date'));
      onClose(false);
    }
  };

  // let before = $derived(DateTime.fromObject(assets[0].localDateTime).toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS"));

  // let after = $derived(
  //   currentInterval ? calcNewDate(currentInterval.end, selectedDuration, selectedOption?.value) : undefined,
  // );

  // when changing the time zone, assume the configured date/time is meant for that time zone (instead of updating it)
  const date = $derived(DateTime.fromISO(selectedDate, { zone: selectedOption?.value, setZone: true }));
</script>

<FormModal
  title={$t('edit_date_and_time')}
  icon={mdiCalendarEdit}
  onClose={() => onClose(false)}
  {onSubmit}
  submitText={$t('confirm')}
  disabled={!date.isValid}
  size="small"
>
  <Field label={$t('edit_date_and_time_by_offset')}>
    <Switch data-testid="edit-by-offset-switch" bind:checked={showRelative} class="mb-2" />
  </Field>
  {#if showRelative}
    <Label for="relativedatetime" class="mb-1 block">{$t('offset')}</Label>
    <DurationInput class="mb-2 immich-form-input w-full" id="relativedatetime" bind:value={selectedDuration} />
  {:else}
    <div class="mb-1 flex items-center justify-between">
      <Label for="datetime">{$t('date_and_time')}</Label>
      {#if isDateChanged}
        <button
          type="button"
          class="text-xs text-primary hover:underline"
          data-testid="reset-date-button"
          aria-label={$t('reset_to_original_value')}
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
      bind:value={selectedDate}
    />
  {/if}
  <div class={['relative w-full', isTimeZoneChanged && '[&_input]:bg-green-100! dark:[&_input]:bg-green-900/40!']}>
    <Combobox
      bind:selectedOption
      label={$t('timezone')}
      options={timezones}
      placeholder={$t('search_timezone')}
      onSelect={(option) => (lastSelectedTimezone = option as ZoneOption)}
    ></Combobox>
    {#if isTimeZoneChanged}
      <button
        type="button"
        class="absolute inset-e-0 top-0 text-xs text-primary hover:underline"
        data-testid="reset-timezone-button"
        aria-label={$t('reset_to_original_value')}
        onclick={resetTimeZone}
      >
        {$t('reset')}
      </button>
    {/if}
  </div>
  <!-- <Card color="secondary" class={!showRelative || !currentInterval ? 'invisible' : ''}>
      <CardBody class="p-2">
        <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center">
          <div class="col-span-2 immich-form-label" data-testid="interval-preview">Preview</div>
          <Text size="small" class="-mt-2 immich-form-label col-span-2"
            >Showing changes for first selected asset only</Text
          >
          <label class="immich-form-label" for="from">Before</label>
          <DateInput
            class="dark:text-gray-300 text-gray-700 text-base"
            id="from"
            type="datetime-local"
            readonly
            bind:value={before}
          />
          <label class="immich-form-label" for="to">After</label>
          <DateInput
            class="dark:text-gray-300 text-gray-700 text-base"
            id="to"
            type="datetime-local"
            readonly
            bind:value={after}
          />
        </div>
      </CardBody>
    </Card> -->
</FormModal>
