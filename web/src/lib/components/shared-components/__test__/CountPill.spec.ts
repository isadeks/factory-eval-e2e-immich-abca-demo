import CountPill from '$lib/components/shared-components/CountPill.svelte';
import { render } from '@testing-library/svelte';

describe('CountPill component', () => {
  it('renders the count', () => {
    const { getByTestId } = render(CountPill, { count: 42 });
    expect(getByTestId('count-pill')).toHaveTextContent('42');
  });

  it('renders zero', () => {
    const { getByTestId } = render(CountPill, { count: 0 });
    expect(getByTestId('count-pill')).toHaveTextContent('0');
  });

  it('formats large numbers with the locale grouping', () => {
    const { getByTestId } = render(CountPill, { count: 1234 });
    expect(getByTestId('count-pill').textContent?.trim()).toMatch(/^1\D?234$/);
  });

  it('supports a custom test id', () => {
    const { getByTestId } = render(CountPill, { count: 3, testId: 'favorites-count' });
    expect(getByTestId('favorites-count')).toHaveTextContent('3');
  });
});
