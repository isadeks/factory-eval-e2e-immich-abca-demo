import { render } from '@testing-library/svelte';
import { addMessages, locale } from 'svelte-i18n';
import DuplicatesCount from './DuplicatesCount.svelte';

describe('DuplicatesCount component', () => {
  beforeAll(async () => {
    addMessages('en', {
      duplicates_count: '{count, plural, one {# duplicate} other {# duplicates}}',
    });
    await locale.set('en');
  });

  it('shows the plural form for multiple duplicates', () => {
    const { getByTestId } = render(DuplicatesCount, { count: 5 });
    expect(getByTestId('duplicates-count')).toHaveTextContent('5 duplicates');
  });

  it('shows the singular form for one duplicate', () => {
    const { getByTestId } = render(DuplicatesCount, { count: 1 });
    expect(getByTestId('duplicates-count')).toHaveTextContent('1 duplicate');
    expect(getByTestId('duplicates-count')).not.toHaveTextContent('duplicates');
  });
});
