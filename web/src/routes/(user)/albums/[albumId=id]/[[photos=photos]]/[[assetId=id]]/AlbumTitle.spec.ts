import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import AlbumTitle from './AlbumTitle.svelte';

const albumName = 'A very long album name that does not fit in the available space on the album page';

const setWidths = (element: HTMLElement, scrollWidth: number, clientWidth: number) => {
  Object.defineProperties(element, {
    scrollWidth: { configurable: true, value: scrollWidth },
    clientWidth: { configurable: true, value: clientWidth },
  });
};

describe('AlbumTitle', () => {
  const props = { id: 'album-1', albumName, isOwned: false, onUpdate: vi.fn() };

  it('shows the full album name as a tooltip when the title is truncated', async () => {
    render(AlbumTitle, { props });
    const title = screen.getByTestId('album-title');
    expect(title).not.toHaveAttribute('title');

    setWidths(title, 500, 200);
    await fireEvent.mouseEnter(title);

    expect(title).toHaveAttribute('title', albumName);
  });

  it('does not show a tooltip when the title fits', async () => {
    render(AlbumTitle, { props });
    const title = screen.getByTestId('album-title');

    setWidths(title, 200, 200);
    await fireEvent.mouseEnter(title);

    expect(title).not.toHaveAttribute('title');
  });
});
