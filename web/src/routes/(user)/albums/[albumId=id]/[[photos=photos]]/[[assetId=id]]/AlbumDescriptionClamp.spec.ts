import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import AlbumDescription from './AlbumDescription.svelte';

const mockLayout = (scrollHeight: number, clientHeight: number) => {
  Object.defineProperties(HTMLElement.prototype, {
    scrollHeight: { configurable: true, get: () => scrollHeight },
    clientHeight: { configurable: true, get: () => clientHeight },
  });
};

describe('AlbumDescription clamping', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight;
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
  });

  it('clamps to 3 lines and toggles Show more / Show less when the text overflows', async () => {
    mockLayout(100, 60);
    render(AlbumDescription, { isOwned: false, id: '', description: 'a long description' });

    const paragraph = screen.getByTestId('album-description');
    expect(paragraph).toHaveClass('line-clamp-3');

    const toggle = await screen.findByTestId('album-description-toggle');
    expect(toggle).toHaveTextContent('show_more');

    await fireEvent.click(toggle);
    expect(paragraph).not.toHaveClass('line-clamp-3');
    expect(screen.getByTestId('album-description-toggle')).toHaveTextContent('show_less');

    await fireEvent.click(screen.getByTestId('album-description-toggle'));
    expect(paragraph).toHaveClass('line-clamp-3');
  });

  it('does not show the toggle when the text fits in 3 lines', () => {
    mockLayout(40, 40);
    render(AlbumDescription, { isOwned: false, id: '', description: 'short' });
    expect(screen.getByTestId('album-description')).toHaveClass('line-clamp-3');
    expect(screen.queryByTestId('album-description-toggle')).not.toBeInTheDocument();
  });
});
