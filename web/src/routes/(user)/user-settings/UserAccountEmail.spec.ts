import { render } from '@testing-library/svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { userAdminFactory } from '@test-data/factories/user-factory';
import UserAccountEmail from './UserAccountEmail.svelte';

describe('UserAccountEmail component', () => {
  beforeEach(() => {
    authManager.reset();
  });

  it('shows the signed-in user email in a muted line', () => {
    authManager.setUser(userAdminFactory.build({ email: 'jane@example.com' }));

    const { getByTestId } = render(UserAccountEmail);

    const element = getByTestId('account-email');
    expect(element).toHaveTextContent('jane@example.com');
    expect(element).toHaveClass('text-gray-500');
  });
});
