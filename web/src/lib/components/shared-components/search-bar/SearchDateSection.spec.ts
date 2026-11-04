import { fireEvent, render } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import type { SearchDateFilter } from '$lib/types';
import SearchDateSection from './SearchDateSection.svelte';

describe('SearchDateSection component', () => {
  it('does not show the clear button when no dates are set', () => {
    const filters: SearchDateFilter = {};
    const { queryByTestId } = render(TestWrapper, {
      component: SearchDateSection,
      componentProps: { filters },
    });

    expect(queryByTestId('clear-date-filter')).toBeNull();
  });

  it('clears both dates when the clear button is clicked', async () => {
    const filters: SearchDateFilter = {
      takenAfter: DateTime.fromISO('2024-01-01'),
      takenBefore: DateTime.fromISO('2024-02-01'),
    };
    const { getByTestId } = render(TestWrapper, {
      component: SearchDateSection,
      componentProps: { filters },
    });

    await fireEvent.click(getByTestId('clear-date-filter'));

    expect(filters.takenAfter).toBeUndefined();
    expect(filters.takenBefore).toBeUndefined();
  });
});
