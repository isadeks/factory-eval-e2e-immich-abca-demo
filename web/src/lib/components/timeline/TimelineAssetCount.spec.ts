import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import TimelineAssetCount from './TimelineAssetCount.svelte';

describe('TimelineAssetCount', () => {
  it('renders the total number of assets', () => {
    render(TimelineAssetCount, { props: { count: 42 } });

    expect(screen.getByTestId('timeline-asset-count')).toHaveTextContent('42');
  });

  it('renders zero', () => {
    render(TimelineAssetCount, { props: { count: 0 } });

    expect(screen.getByTestId('timeline-asset-count')).toHaveTextContent('0');
  });

  it('updates when the count changes', async () => {
    const { rerender } = render(TimelineAssetCount, { props: { count: 1 } });
    await rerender({ count: 7 });

    expect(screen.getByTestId('timeline-asset-count')).toHaveTextContent('7');
  });
});
