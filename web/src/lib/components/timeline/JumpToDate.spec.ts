import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import JumpToDate from './JumpToDate.svelte';

describe('JumpToDate', () => {
  it('shows a Jump to date button and no input initially', () => {
    render(JumpToDate, { props: { onJump: vi.fn() } });
    expect(screen.getByRole('button', { name: /jump_to_date|Jump to date/ })).toBeInTheDocument();
    expect(screen.queryByTestId('jump-to-date-input')).not.toBeInTheDocument();
  });

  it('calls onJump with the chosen year and month and closes the input', async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    render(JumpToDate, { props: { onJump } });

    await user.click(screen.getByTestId('jump-to-date-button'));
    const input = screen.getByTestId('jump-to-date-input');
    await fireEvent.input(input, { target: { value: '2023-04-15' } });
    await fireEvent.change(input);

    expect(onJump).toHaveBeenCalledExactlyOnceWith({ year: 2023, month: 4 });
    expect(screen.queryByTestId('jump-to-date-input')).not.toBeInTheDocument();
  });

  it('does not call onJump when the input is cleared', async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    render(JumpToDate, { props: { onJump } });

    await user.click(screen.getByTestId('jump-to-date-button'));
    await fireEvent.change(screen.getByTestId('jump-to-date-input'));
    expect(onJump).not.toHaveBeenCalled();
  });
});
