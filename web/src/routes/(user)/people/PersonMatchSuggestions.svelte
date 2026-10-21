<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    confirmMatchSuggestion,
    rejectMatchSuggestion,
    type PersonMatchSuggestionResponseDto,
    type PersonResponseDto,
  } from '@immich/sdk';
  import { Button, Icon, toastManager } from '@immich/ui';
  import { mdiHelpCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    suggestions: PersonMatchSuggestionResponseDto[];
    /** called after a suggestion was confirmed (people were merged) or rejected */
    onResolved: (suggestion: PersonMatchSuggestionResponseDto, merged: boolean) => void | Promise<void>;
  };

  let { suggestions, onResolved }: Props = $props();

  let busyId = $state<string>();

  const name = (person: PersonResponseDto) => person.name || $t('unnamed_person');

  const confirm = async (suggestion: PersonMatchSuggestionResponseDto) => {
    busyId = suggestion.id;
    try {
      await confirmMatchSuggestion({ id: suggestion.id });
      toastManager.primary($t('merge_people_successfully'));
      await onResolved(suggestion, true);
    } catch (error) {
      handleError(error, $t('person_match_failed'));
    } finally {
      busyId = undefined;
    }
  };

  const reject = async (suggestion: PersonMatchSuggestionResponseDto) => {
    busyId = suggestion.id;
    try {
      await rejectMatchSuggestion({ id: suggestion.id });
      await onResolved(suggestion, false);
    } catch (error) {
      handleError(error, $t('person_match_failed'));
    } finally {
      busyId = undefined;
    }
  };
</script>

{#if suggestions.length > 0}
  <section
    class="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-immich-dark-gray"
    data-testid="person-match-suggestions"
    aria-label={$t('person_match_title')}
  >
    <div class="mb-3 flex items-center gap-2 dark:text-white">
      <Icon icon={mdiHelpCircleOutline} size="24" />
      <h2 class="text-lg font-medium">{$t('person_match_title')}</h2>
    </div>
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">{$t('person_match_description')}</p>

    <ul class="flex flex-wrap gap-4">
      {#each suggestions as suggestion (suggestion.id)}
        <li
          class="flex w-72 flex-col items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-black"
          data-testid="person-match-suggestion"
        >
          <div class="flex items-center gap-4">
            {#each [suggestion.person, suggestion.suggestedPerson] as person (person.id)}
              <a href={`/people/${person.id}`} class="flex w-24 flex-col items-center gap-1 text-center">
                <ImageThumbnail
                  circle
                  shadow
                  url={getPeopleThumbnailUrl(person)}
                  altText={name(person)}
                  title={name(person)}
                  widthStyle="96px"
                  preload={false}
                />
                <span class="line-clamp-1 text-sm dark:text-white">{name(person)}</span>
              </a>
            {/each}
          </div>
          <div class="flex gap-2">
            <Button size="small" disabled={busyId === suggestion.id} onclick={() => confirm(suggestion)}>
              {$t('person_match_same')}
            </Button>
            <Button
              size="small"
              variant="ghost"
              color="secondary"
              disabled={busyId === suggestion.id}
              onclick={() => reject(suggestion)}
            >
              {$t('person_match_different')}
            </Button>
          </div>
        </li>
      {/each}
    </ul>
  </section>
{/if}
