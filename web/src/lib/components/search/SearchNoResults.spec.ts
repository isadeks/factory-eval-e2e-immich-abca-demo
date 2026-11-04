import { render, screen } from '@testing-library/svelte';
import { addMessages, locale } from 'svelte-i18n';
import SearchNoResults from './SearchNoResults.svelte';

describe('SearchNoResults component', () => {
  beforeAll(async () => {
    addMessages('en', {
      no_results: 'No results',
      no_results_for_query: 'No results for "{query}"',
      no_results_description: 'Try a synonym or more general keyword',
    });
    await locale.set('en');
  });

  it('echoes the query in the message', () => {
    render(SearchNoResults, { query: 'sunset beach' });
    expect(screen.getByTestId('search-no-results')).toHaveTextContent('No results for "sunset beach"');
  });

  it('trims the echoed query', () => {
    render(SearchNoResults, { query: '  cats  ' });
    expect(screen.getByTestId('search-no-results')).toHaveTextContent('No results for "cats"');
  });

  it.each([undefined, null, '', ' '.repeat(3)])('falls back to plain message for query %j', (query) => {
    render(SearchNoResults, { query });
    expect(screen.getByTestId('search-no-results')).toHaveTextContent(/^No results$/);
  });
});
