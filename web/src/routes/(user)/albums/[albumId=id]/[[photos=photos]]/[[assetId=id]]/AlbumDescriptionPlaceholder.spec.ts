import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AlbumDescription from './AlbumDescription.svelte';

describe('AlbumDescription placeholder', () => {
  it('shows a "No description" placeholder to the owner when the description is empty', () => {
    render(AlbumDescription, { isOwned: true, id: '', description: '' });
    expect(screen.getByTestId('autogrow-textarea')).toHaveAttribute('placeholder', 'no_description');
  });

  it('shows no placeholder text to non-owners when the description is empty', () => {
    render(AlbumDescription, { isOwned: false, id: '', description: '' });
    expect(screen.queryByText('no_description')).not.toBeInTheDocument();
  });
});
