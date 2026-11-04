import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import CapsLockWarning from './CapsLockWarning.svelte';

const press = (element: HTMLElement, type: 'keydown' | 'keyup', key: string, capsLock: boolean) => {
  const event = new KeyboardEvent(type, { key, bubbles: true });
  // not every DOM implementation honours `modifierCapsLock`, so stub the modifier state directly
  event.getModifierState = (modifier: string) => modifier === 'CapsLock' && capsLock;
  element.dispatchEvent(event);
};

describe('CapsLockWarning', () => {
  const renderWarning = () => {
    const children = createRawSnippet(() => ({ render: () => '<input data-testid="field" type="password" />' }));
    render(CapsLockWarning, { props: { children } });
    return screen.getByTestId('field');
  };

  it('does not show the warning initially', () => {
    renderWarning();
    expect(screen.queryByTestId('caps-lock-warning')).not.toBeInTheDocument();
  });

  it('shows the warning while Caps Lock is active and hides it when turned off', async () => {
    const input = renderWarning();

    press(input, 'keydown', 'a', true);
    await waitFor(() => expect(screen.getByTestId('caps-lock-warning')).toBeInTheDocument());

    press(input, 'keyup', 'CapsLock', false);
    await waitFor(() => expect(screen.queryByTestId('caps-lock-warning')).not.toBeInTheDocument());
  });

  it('hides the warning when the field loses focus', async () => {
    const input = renderWarning();

    press(input, 'keydown', 'A', true);
    await waitFor(() => expect(screen.getByTestId('caps-lock-warning')).toBeInTheDocument());

    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await waitFor(() => expect(screen.queryByTestId('caps-lock-warning')).not.toBeInTheDocument());
  });
});
