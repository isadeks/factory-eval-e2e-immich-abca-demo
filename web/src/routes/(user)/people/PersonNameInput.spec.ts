import { fireEvent, render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';
import { personFactory } from '@test-data/factories/person-factory';
import PersonNameInput from './PersonNameInput.svelte';

describe('PersonNameInput component', () => {
  const longName = 'Bartholomew Maximilian Featherstonehaugh-Cholmondeley the Third';

  it('shows the full name as a tooltip (title) so truncated names remain readable', () => {
    const person = personFactory.build({ name: longName });
    render(PersonNameInput, { person, onFocus: vi.fn(), onBlur: vi.fn(), onInput: vi.fn() });

    const input = screen.getByDisplayValue(longName);
    expect(input).toHaveAttribute('title', longName);
  });

  it('has no tooltip when the person has no name', () => {
    const person = personFactory.build({ name: '' });
    const { baseElement } = render(PersonNameInput, { person, onFocus: vi.fn(), onBlur: vi.fn(), onInput: vi.fn() });

    expect(baseElement.querySelector('input')).not.toHaveAttribute('title');
  });

  it('calls the focus and blur callbacks', async () => {
    const person = personFactory.build({ name: 'Alice' });
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const { baseElement } = render(PersonNameInput, { person, onFocus, onBlur, onInput: vi.fn() });
    const input = baseElement.querySelector('input')!;

    await fireEvent.focusIn(input);
    await fireEvent.focusOut(input);

    expect(onFocus).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });
});
