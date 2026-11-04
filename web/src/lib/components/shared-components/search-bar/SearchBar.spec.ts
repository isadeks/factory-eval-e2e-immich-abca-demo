import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { goto } from '$app/navigation';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import SearchBar from './SearchBar.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.mocked(goto).mockReset();
    localStorage.clear();
  });

  it('does not navigate when pressing Enter on an empty query', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(TestWrapper, { component: SearchBar, componentProps: { grayTheme: false } });

    await user.click(getByRole('combobox'));
    await user.keyboard('{Enter}');

    expect(goto).not.toHaveBeenCalled();
  });

  it('does not navigate when pressing Enter on a whitespace-only query', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(TestWrapper, { component: SearchBar, componentProps: { grayTheme: false } });

    await user.type(getByRole('combobox'), '   {Enter}');

    expect(goto).not.toHaveBeenCalled();
  });

  it('navigates when pressing Enter with a query', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(TestWrapper, { component: SearchBar, componentProps: { grayTheme: false } });

    await user.type(getByRole('combobox'), 'beach{Enter}');

    expect(goto).toHaveBeenCalledTimes(1);
    expect(vi.mocked(goto).mock.calls[0][0]).toContain('beach');
  });
});
