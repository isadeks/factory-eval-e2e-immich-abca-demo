import { render, screen } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { vi } from 'vitest';
import { personFactory } from '@test-data/factories/person-factory';
import ExplorePage from './+page.svelte';

vi.mock('$lib/components/layouts/UserPageLayout.svelte', async () => {
  return await import('@test-data/mocks/UserPageLayout.mock.svelte');
});

type PageData = ComponentProps<typeof ExplorePage>['data'];

const getData = ({
  people = [],
  total = people.length,
  places = [],
}: {
  people?: ReturnType<typeof personFactory.build>[];
  total?: number;
  places?: { value: string; data: { id: string } }[];
} = {}) =>
  ({
    meta: { title: 'Explore' },
    items: [
      { fieldName: 'exifInfo.city', items: places },
      { fieldName: 'createdAt', items: [] },
    ],
    response: { people, total, hidden: 0, hasNextPage: false },
  }) as unknown as PageData;

describe('Explore page', () => {
  it('shows only the sections that have items', () => {
    render(ExplorePage, {
      data: getData({
        people: [personFactory.build({ name: 'Alice' })],
        places: [{ value: 'Paris', data: { id: 'asset-1' } }],
      }),
    });

    expect(screen.getByText('people')).toBeInTheDocument();
    expect(screen.getByText('places')).toBeInTheDocument();
    expect(screen.queryByText('recently_added')).not.toBeInTheDocument();
    expect(screen.queryByText('no_explore_results_message')).not.toBeInTheDocument();
  });

  it('hides the people section when there are no visible people, even if the total is non-zero', () => {
    render(ExplorePage, {
      data: getData({ people: [], total: 3, places: [{ value: 'Paris', data: { id: 'asset-1' } }] }),
    });

    expect(screen.queryByText('people')).not.toBeInTheDocument();
    expect(screen.getByText('places')).toBeInTheDocument();
  });

  it('shows the empty placeholder when every section is empty', () => {
    render(ExplorePage, { data: getData({ total: 3 }) });

    expect(screen.queryByText('people')).not.toBeInTheDocument();
    expect(screen.queryByText('places')).not.toBeInTheDocument();
    expect(screen.queryByText('recently_added')).not.toBeInTheDocument();
    expect(screen.getByText('no_explore_results_message')).toBeInTheDocument();
  });
});
