import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { personFactory } from '@test-data/factories/person-factory';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'svelte';
import { vi } from 'vitest';
import ManagePeoplePage from './+page.svelte';
import ManagePeoplePageTestWrapper from './ManagePeopleVisibility.test-wrapper.svelte';

vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
  return {
    featureFlagsManager: { init: vi.fn(), loadFeatureFlags: vi.fn(), value: {} } as never,
  };
});

vi.mock('$lib/components/layouts/UserPageLayout.svelte', async () => {
  return await import('@test-data/mocks/UserPageLayout.mock.svelte');
});

const getData = (people: ReturnType<typeof personFactory.build>[]): ComponentProps<typeof ManagePeoplePage>['data'] => ({
  error: undefined,
  meta: { title: 'Manage people visibility' },
  asset: undefined,
  people: {
    people,
    total: people.length,
    hidden: people.filter((person) => person.isHidden).length,
    hasNextPage: false,
  },
});

describe('People manage page hidden badge', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  it('shows a Hidden badge only on hidden people', () => {
    const visible = personFactory.build({ id: 'a', isHidden: false });
    const hidden = personFactory.build({ id: 'b', isHidden: true });

    const { container } = render(ManagePeoplePageTestWrapper, { data: getData([visible, hidden]) });

    const buttons = container.querySelectorAll('button[aria-pressed]');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].querySelector('[data-testid="hidden-badge"]')).toBeNull();
    expect(buttons[1].querySelector('[data-testid="hidden-badge"]')?.textContent?.trim()).toBe('hidden');
  });

  it('updates the badge when a person is toggled', async () => {
    const person = personFactory.build({ id: 'a', isHidden: false });
    const { container } = render(ManagePeoplePageTestWrapper, { data: getData([person]) });
    const user = userEvent.setup();

    const button = container.querySelector('button[aria-pressed]')!;
    expect(button.querySelector('[data-testid="hidden-badge"]')).toBeNull();

    await user.click(button);
    expect(button.querySelector('[data-testid="hidden-badge"]')).not.toBeNull();

    await user.click(button);
    expect(button.querySelector('[data-testid="hidden-badge"]')).toBeNull();
  });
});
