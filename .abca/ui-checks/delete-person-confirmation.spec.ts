import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

test('deleting a person asks for confirmation first', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const created = await request.post(`${API}/people`, { headers, data: { name: 'Confirm Me' } });
  expect(created.ok()).toBeTruthy();
  const person = await created.json();

  await signIn(page);
  await page.goto(`/people/${person.id}`);

  const menuButton = page.getByRole('button', { name: 'Open' });
  await menuButton.click();
  const deleteItem = page.getByRole('menuitem', { name: 'Delete person' });
  await highlight(page, deleteItem, 'New: Delete person');
  await shot(page, 'Person menu offers Delete person', { focus: deleteItem });
  await deleteItem.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Are you sure you want to delete Confirm Me?');
  await shot(page, 'Confirmation is shown before removing', { focus: dialog });

  // Cancelling keeps the person
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  const stillThere = await request.get(`${API}/people/${person.id}`, { headers });
  expect(stillThere.status()).toBe(200);

  // Confirming removes the person
  await menuButton.click();
  await page.getByRole('menuitem', { name: 'Delete person' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page).not.toHaveURL(new RegExp(person.id));
  await expect.poll(async () => (await request.get(`${API}/people/${person.id}`, { headers })).status()).toBe(400);
  await shot(page, 'After confirming, the person is gone');
});
