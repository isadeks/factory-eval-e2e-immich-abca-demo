import { render } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import LibraryLastScanned from '$lib/components/LibraryLastScanned.svelte';

describe('LibraryLastScanned component', () => {
  it('renders the last scan time as a time element', () => {
    const refreshedAt = DateTime.now().minus({ hours: 3 }).toUTC().toISO()!;
    const { getByTestId } = render(LibraryLastScanned, { refreshedAt });

    const root = getByTestId('library-last-scanned');
    expect(root.textContent).toContain('last_scanned');

    const time = root.querySelector('time');
    expect(time).not.toBeNull();
    expect(DateTime.fromISO(time!.getAttribute('datetime')!).toMillis()).toBe(DateTime.fromISO(refreshedAt).toMillis());
    expect(time!.textContent).toContain('3 hours ago');
  });

  it('shows "never" when the library has not been scanned', () => {
    const { getByTestId } = render(LibraryLastScanned, { refreshedAt: null });

    const root = getByTestId('library-last-scanned');
    expect(root.querySelector('time')).toBeNull();
    expect(root.textContent).toContain('never');
  });
});
