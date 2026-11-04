import { render } from '@testing-library/svelte';
import ExplorePeopleHeading from '$lib/components/explore/ExplorePeopleHeading.svelte';

describe('ExplorePeopleHeading component', () => {
  it('shows the person count next to the heading', () => {
    const { getByTestId } = render(ExplorePeopleHeading, { count: 12 });
    expect(getByTestId('explore-people-count')).toHaveTextContent('(12)');
  });

  it('shows a count of zero', () => {
    const { getByTestId } = render(ExplorePeopleHeading, { count: 0 });
    expect(getByTestId('explore-people-count')).toHaveTextContent('(0)');
  });
});
