import TimelineDayCount from '$lib/components/timeline/TimelineDayCount.svelte';
import { render } from '@testing-library/svelte';
import { addMessages, locale } from 'svelte-i18n';
import en from '../../../../../i18n/en.json';

describe('TimelineDayCount component', () => {
  beforeAll(async () => {
    addMessages('en', en);
    await locale.set('en');
  });

  it('renders the plural form for multiple assets', () => {
    const { getByTestId } = render(TimelineDayCount, { count: 7 });
    expect(getByTestId('timeline-day-count')).toHaveTextContent('· 7 photos');
  });

  it('renders the singular form for a single asset', () => {
    const { getByTestId } = render(TimelineDayCount, { count: 1 });
    expect(getByTestId('timeline-day-count')).toHaveTextContent('· 1 photo');
    expect(getByTestId('timeline-day-count')).not.toHaveTextContent('photos');
  });

  it('is rendered in a muted style', () => {
    const { getByTestId } = render(TimelineDayCount, { count: 3 });
    expect(getByTestId('timeline-day-count')).toHaveClass('text-gray-500');
  });
});
