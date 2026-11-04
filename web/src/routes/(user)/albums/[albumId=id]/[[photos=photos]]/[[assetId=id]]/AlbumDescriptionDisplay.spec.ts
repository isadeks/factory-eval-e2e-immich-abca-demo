import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AlbumDescription from './AlbumDescription.svelte';

describe('AlbumDescription read-only display', () => {
  it('shows the description in a secondary-text paragraph when not owned', () => {
    render(AlbumDescription, { isOwned: false, id: '', description: 'Summer trip 2024' });
    const paragraph = screen.getByTestId('album-description');
    expect(paragraph.tagName).toBe('P');
    expect(paragraph).toHaveTextContent('Summer trip 2024');
    expect(paragraph).toHaveClass('text-sm', 'dark:text-immich-dark-fg');
  });

  it('renders nothing when there is no description and not owned', () => {
    render(AlbumDescription, { isOwned: false, id: '', description: '' });
    expect(screen.queryByTestId('album-description')).not.toBeInTheDocument();
  });

  it('shows the description in the editable textarea when owned', () => {
    render(AlbumDescription, { isOwned: true, id: '', description: 'Summer trip 2024' });
    expect(screen.getByTestId('autogrow-textarea')).toHaveValue('Summer trip 2024');
    expect(screen.queryByTestId('album-description')).not.toBeInTheDocument();
  });
});
