import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { DateTime } from 'luxon';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { userAdminFactory } from '@test-data/factories/user-factory';
import AssetSelectionChangeDateModal from './AssetSelectionChangeDateModal.svelte';

describe('AssetSelectionChangeDateModal changed indicators', () => {
  const initialDate = DateTime.fromISO('2024-01-01');
  const initialTimeZone = 'Europe/Berlin';
  const onClose = vi.fn();

  const getDateInput = () => screen.getByLabelText('date_and_time') as HTMLInputElement;
  const getTimeZoneInput = () => screen.getByLabelText('timezone') as HTMLInputElement;

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();

    authManager.setUser(userAdminFactory.build());
    render(AssetSelectionChangeDateModal, { props: { initialDate, initialTimeZone, assets: [], onClose } });
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('does not highlight any field initially', () => {
    expect(getDateInput()).not.toHaveClass('immich-form-input-changed');
    expect(getTimeZoneInput()).not.toHaveClass('immich-form-input-changed');
  });

  test('does not highlight the date when the browser strips the seconds', async () => {
    await fireEvent.input(getDateInput(), { target: { value: '2024-01-01T00:00' } });
    await fireEvent.blur(getDateInput());

    expect(getDateInput()).not.toHaveClass('immich-form-input-changed');
  });

  test('highlights only the timezone when only the timezone changed', async () => {
    await fireEvent.focus(getTimeZoneInput());
    await fireEvent.input(getTimeZoneInput(), { target: { value: 'Pacific/Pitcairn' } });
    await fireEvent.click(await screen.findByText(/Pacific\/Pitcairn/i));

    expect(getTimeZoneInput()).toHaveClass('immich-form-input-changed');
    expect(getDateInput()).not.toHaveClass('immich-form-input-changed');
  });

  test('highlights only the date when only the date changed', async () => {
    await fireEvent.input(getDateInput(), { target: { value: '2024-02-02T10:00:00' } });
    await fireEvent.blur(getDateInput());

    await waitFor(() => expect(getDateInput()).toHaveClass('immich-form-input-changed'));
    expect(getTimeZoneInput()).not.toHaveClass('immich-form-input-changed');
  });

  test('highlights the offset once it is set in relative mode', async () => {
    await fireEvent.click(screen.getByTestId('edit-by-offset-switch'));
    const offsetGroup = screen.getByPlaceholderText('days').parentElement!;
    expect(offsetGroup).not.toHaveClass('immich-form-input-changed');

    await fireEvent.input(screen.getByPlaceholderText('hours'), { target: { value: 2 } });

    await waitFor(() => expect(offsetGroup).toHaveClass('immich-form-input-changed'));
  });
});
