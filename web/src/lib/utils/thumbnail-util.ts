import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import { derived, get } from 'svelte/store';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { locale } from '$lib/stores/preferences.store';
import { fromTimelinePlainDateTime } from '$lib/utils/timeline-util';

/**
 * Calculate thumbnail size based on number of assets and viewport width
 * @param assetCount Number of assets in the view
 * @param viewWidth viewport width
 * @returns thumbnail size
 */
export function getThumbnailSize(assetCount: number, viewWidth: number): number {
  if (assetCount < 6) {
    return Math.min(320, Math.floor(viewWidth / assetCount - assetCount));
  }

  if (viewWidth > 600) {
    return viewWidth / 7 - 7;
  }

  if (viewWidth > 400) {
    return viewWidth / 4 - 6;
  }

  if (viewWidth > 300) {
    return viewWidth / 2 - 6;
  }

  if (viewWidth > 200) {
    return viewWidth / 2 - 6;
  }

  if (viewWidth > 100) {
    return viewWidth / 1 - 6;
  }

  return 300;
}

/**
 * Tooltip text for a thumbnail: the capture date (and time) in the asset's local time.
 */
export const getThumbnailTitle = (asset: TimelineAsset, dateLocale?: string): string => {
  // tolerate assets that still carry an ISO string (e.g. raw AssetResponseDto) instead of a plain date-time object
  const localDateTime =
    typeof asset.localDateTime === 'string'
      ? DateTime.fromISO(asset.localDateTime, { zone: 'UTC' })
      : fromTimelinePlainDateTime(asset.localDateTime);
  return localDateTime.toLocaleString(DateTime.DATETIME_MED, { locale: dateLocale });
};

export const getAltText = derived(t, ($t) => {
  return (asset: TimelineAsset) => {
    const date = fromTimelinePlainDateTime(asset.localDateTime).toJSDate().toLocaleString(get(locale), {
      dateStyle: 'long',
      timeZone: 'UTC',
    });
    const hasPlace = asset.city && asset.country;

    const peopleCount = asset.people?.length ?? 0;
    const isVideo = asset.isVideo;

    const values = {
      date,
      city: asset.city,
      country: asset.country,
      person1: asset.people?.[0],
      person2: asset.people?.[1],
      person3: asset.people?.[2],
      isVideo,
      additionalCount: peopleCount > 3 ? peopleCount - 2 : 0,
    };

    if (peopleCount > 0) {
      switch (peopleCount) {
        case 1: {
          return hasPlace
            ? $t('image_alt_text_date_place_1_person', { values })
            : $t('image_alt_text_date_1_person', { values });
        }
        case 2: {
          return hasPlace
            ? $t('image_alt_text_date_place_2_people', { values })
            : $t('image_alt_text_date_2_people', { values });
        }
        case 3: {
          return hasPlace
            ? $t('image_alt_text_date_place_3_people', { values })
            : $t('image_alt_text_date_3_people', { values });
        }
        default: {
          return hasPlace
            ? $t('image_alt_text_date_place_4_or_more_people', { values })
            : $t('image_alt_text_date_4_or_more_people', { values });
        }
      }
    }

    if (hasPlace) {
      return $t('image_alt_text_date_place', { values });
    }

    return $t('image_alt_text_date', { values });
  };
});
