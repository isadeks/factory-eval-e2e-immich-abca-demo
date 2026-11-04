import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import TimelineDaySelectCheckbox from '$lib/components/timeline/TimelineDaySelectCheckbox.svelte';

describe('TimelineDaySelectCheckbox component', () => {
  it('renders an unchecked, labelled checkbox', () => {
    const { getByRole } = render(TimelineDaySelectCheckbox, { checked: false, onToggle: vi.fn() });
    const checkbox = getByRole('checkbox', { name: 'select_all_in_day' }) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
  });

  it('reflects the checked state', () => {
    const { getByRole } = render(TimelineDaySelectCheckbox, { checked: true, onToggle: vi.fn() });
    expect((getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    const { getByRole } = render(TimelineDaySelectCheckbox, { checked: false, onToggle });
    await userEvent.setup().click(getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
