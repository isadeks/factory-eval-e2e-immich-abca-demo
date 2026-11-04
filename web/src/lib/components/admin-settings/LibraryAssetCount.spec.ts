import { render } from '@testing-library/svelte';
import { locale } from '$lib/stores/preferences.store';
import LibraryAssetCount from './LibraryAssetCount.svelte';

describe('LibraryAssetCount component', () => {
  beforeEach(() => {
    locale.set('en');
  });

  it('renders the asset count', () => {
    const { getByTestId } = render(LibraryAssetCount, { props: { count: 42 } });
    expect(getByTestId('library-asset-count').textContent).toBe('42');
  });

  it('renders zero for an empty library', () => {
    const { getByTestId } = render(LibraryAssetCount, { props: { count: 0 } });
    expect(getByTestId('library-asset-count').textContent).toBe('0');
  });

  it('formats large counts using the user locale', () => {
    const { getByTestId } = render(LibraryAssetCount, { props: { count: 1_234_567 } });
    expect(getByTestId('library-asset-count').textContent).toBe((1_234_567).toLocaleString('en'));
  });
});
