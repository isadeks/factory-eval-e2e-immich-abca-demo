import '@testing-library/jest-dom';
import { screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { renderWithTooltips } from '$tests/helpers';
import SearchBar from './SearchBar.svelte';

describe('SearchBar clear button', () => {
  it('is hidden while the input is empty', () => {
    renderWithTooltips(SearchBar, { value: '', grayTheme: false });

    expect(screen.queryByRole('button', { name: 'clear' })).not.toBeInTheDocument();
  });

  it('is shown when the input has text', () => {
    renderWithTooltips(SearchBar, { value: 'sunset', grayTheme: false });

    expect(screen.getByRole('button', { name: 'clear' })).toBeInTheDocument();
  });

  it('appears after typing and disappears when the query is emptied', async () => {
    const user = userEvent.setup();
    renderWithTooltips(SearchBar, { value: '', grayTheme: false });

    const input = screen.getByRole('combobox');
    await user.type(input, 'beach');

    expect(screen.getByRole('button', { name: 'clear' })).toBeInTheDocument();

    await user.clear(input);

    expect(screen.queryByRole('button', { name: 'clear' })).not.toBeInTheDocument();
  });

  it('empties the input and focuses it when clicked', async () => {
    const user = userEvent.setup();
    renderWithTooltips(SearchBar, { value: 'sunset', grayTheme: false });

    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('sunset');
    expect(input).not.toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'clear' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'clear' })).not.toBeInTheDocument();
  });

  it('keeps focus in the input while the button is pressed', async () => {
    const user = userEvent.setup();
    renderWithTooltips(SearchBar, { value: 'sunset', grayTheme: false });

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(input).toHaveFocus();

    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByRole('button', { name: 'clear' }) });

    expect(input).toHaveFocus();
  });
});
