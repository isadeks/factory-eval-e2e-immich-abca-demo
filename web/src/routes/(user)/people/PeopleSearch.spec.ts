import { searchPerson } from '@immich/sdk';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'svelte';
import { vi } from 'vitest';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { personFactory } from '@test-data/factories/person-factory';
import PeoplePage from './+page.svelte';
import PeoplePageTestWrapper from './PeopleSearch.test-wrapper.svelte';

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store');
  return { page: readable({ url: new URL('http://localhost/people') }) };
});

vi.mock('$app/navigation', () => ({ goto: vi.fn(), afterNavigate: vi.fn(), beforeNavigate: vi.fn() }));

vi.mock('$lib/utils/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/utils/navigation')>()),
  clearQueryParam: vi.fn(),
}));

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  searchPerson: vi.fn(),
}));

vi.mock('$lib/components/layouts/UserPageLayout.svelte', async () => {
  return await import('@test-data/mocks/UserPageLayout.mock.svelte');
});

const getData = (people: ReturnType<typeof personFactory.build>[]): ComponentProps<typeof PeoplePage>['data'] => ({
  meta: { title: 'People' },
  people: { people, total: people.length, hidden: 0, hasNextPage: false },
});

describe('People page search', () => {
  const alice = personFactory.build({ id: 'alice', name: 'Alice Smith', isHidden: false });
  const bob = personFactory.build({ id: 'bob', name: 'Bob Jones', isHidden: false });
  const carol = personFactory.build({ id: 'carol', name: 'Carol Alison', isHidden: false });
  const everyone = [alice, bob, carol];

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    // the server matches names case-insensitively
    vi.mocked(searchPerson).mockImplementation(({ name }) =>
      Promise.resolve(everyone.filter((person) => person.name.toLowerCase().includes(name.toLowerCase()))),
    );
  });

  const getNameInputs = () => screen.queryAllByPlaceholderText('add_a_name') as HTMLInputElement[];

  it('shows every person when the search box is empty', () => {
    render(PeoplePageTestWrapper, { data: getData(everyone) });

    expect(screen.getByPlaceholderText('search_people')).toBeInTheDocument();
    expect(getNameInputs().map((input) => input.value)).toEqual(['Alice Smith', 'Bob Jones', 'Carol Alison']);
  });

  it('filters the grid by name regardless of case', async () => {
    render(PeoplePageTestWrapper, { data: getData(everyone) });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('search_people'), 'ALI');

    await waitFor(() => expect(getNameInputs().map((input) => input.value)).toEqual(['Alice Smith', 'Carol Alison']));
  });

  it('shows the empty state when nothing matches', async () => {
    render(PeoplePageTestWrapper, { data: getData(everyone) });
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('search_people'), 'zzz');

    await waitFor(() => expect(getNameInputs()).toHaveLength(0));
    expect(screen.getByText('search_no_people_named')).toBeInTheDocument();
  });
});
