import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

async function api(method: string, path: string, token: string | undefined, body?: unknown) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

test('album invite modal lets the owner pick Viewer or Editor while sharing', async ({ page }) => {
  const { accessToken } = await api('POST', '/auth/login', undefined, {
    email: process.env.PREVIEW_ADMIN_EMAIL,
    password: process.env.PREVIEW_ADMIN_PASSWORD,
  });

  const suffix = Date.now();
  const viewerName = `Alice Viewing ${suffix}`;
  const editorName = `Bob Editing ${suffix}`;
  for (const name of [viewerName, editorName]) {
    await api('POST', '/admin/users', accessToken, {
      email: `${name.replaceAll(' ', '.').toLowerCase()}@example.com`,
      name,
      password: 'password-1234',
    });
  }
  const album = await api('POST', '/albums', accessToken, { albumName: `Role sharing ${suffix}` });

  await signIn(page);
  await page.goto(`/albums/${album.id}`);

  await page.getByRole('button', { name: 'Share', exact: true }).first().click();
  const options = page.getByRole('dialog');
  await expect(options.getByText('Invite People')).toBeVisible();
  await options.getByRole('button', { name: 'Invite People' }).click();

  // The invite modal is stacked on top of the options modal.
  const invite = page.getByRole('dialog').last();
  const roleSelect = invite.getByRole('button', { name: 'Role', exact: true });
  await expect(roleSelect).toBeVisible();
  await expect(roleSelect).toContainText('Editor');
  await expect(invite.getByText('Role', { exact: true })).toBeVisible();

  // Viewer
  await roleSelect.click();
  await page.getByRole('option', { name: 'Viewer' }).click();
  await invite.getByText(viewerName).click();
  await highlight(page, invite.getByText('Role', { exact: true }), 'New: role picker');
  await shot(page, 'Invite modal has a role picker set to Viewer', { focus: invite });
  await invite.getByRole('button', { name: 'Add', exact: true }).click();

  // The new user is listed as a Viewer straight away, without opening the role dropdown afterwards.
  await expect(async () => {
    const info = await api('GET', `/albums/${album.id}`, accessToken);
    const shared = info.albumUsers.find((u: { user: { name: string } }) => u.user.name === viewerName);
    expect(shared?.role).toBe('viewer');
  }).toPass();

  const people = page.getByRole('dialog').last();
  await expect(people.getByText(viewerName)).toBeVisible();
  await highlight(page, people.getByText(viewerName), 'Added as Viewer');
  await shot(page, 'The invited user was added as a Viewer', { focus: people });

  // Editor
  await people.getByRole('button', { name: 'Invite People' }).click();
  const invite2 = page.getByRole('dialog').last();
  await invite2.getByText(editorName).click();
  await invite2.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(async () => {
    const info = await api('GET', `/albums/${album.id}`, accessToken);
    const shared = info.albumUsers.find((u: { user: { name: string } }) => u.user.name === editorName);
    expect(shared?.role).toBe('editor');
  }).toPass();
});
