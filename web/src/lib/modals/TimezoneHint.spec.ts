import { render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { userAdminFactory } from '@test-data/factories/user-factory';
import AssetChangeDateModal from './AssetChangeDateModal.svelte';
import AssetSelectionChangeDateModal from './AssetSelectionChangeDateModal.svelte';

describe('edit date and time dialogs timezone hint', () => {
  const initialDate = DateTime.fromISO('2026-03-19T23:31:30.112');
  const initialTimeZone = 'Europe/Lisbon';
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    authManager.setUser(userAdminFactory.build());
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('single asset dialog shows the hint after the timezone selector', async () => {
    render(AssetChangeDateModal, {
      props: { initialDate, initialTimeZone, timezoneInput: true, asset: { id: 'asset-id' } as never, onClose },
    });

    const hint = await screen.findByTestId('timezone-hint');
    expect(hint).toHaveTextContent('timezone_hint');
    const combobox = screen.getByRole('combobox', { name: /timezone/i });
    expect(combobox.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('single asset dialog hides the hint when the timezone selector is hidden', async () => {
    render(AssetChangeDateModal, {
      props: { initialDate, initialTimeZone, timezoneInput: false, asset: { id: 'asset-id' } as never, onClose },
    });

    await screen.findByDisplayValue('2026-03-19T23:31:30.112');
    expect(screen.queryByTestId('timezone-hint')).toBeNull();
  });

  test('multi-select dialog shows the hint after the timezone selector', async () => {
    render(AssetSelectionChangeDateModal, {
      props: { initialDate, initialTimeZone, assets: [], onClose },
    });

    const hint = await screen.findByTestId('timezone-hint');
    expect(hint).toHaveTextContent('timezone_hint');
    expect(
      screen.getByLabelText('timezone').compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
