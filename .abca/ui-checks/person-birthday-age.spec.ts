import { expect, test } from '@playwright/test';
import { highlight, shot, signIn } from './feval-annotate';

const API = process.env.PREVIEW_API_URL!;

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('person page shows the age derived from the birthday', async ({ page, request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: process.env.PREVIEW_ADMIN_EMAIL, password: process.env.PREVIEW_ADMIN_PASSWORD },
  });
  expect(login.ok()).toBeTruthy();
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  // born 5 years and 10 days ago -> "Age 5"
  const birth = new Date();
  birth.setFullYear(birth.getFullYear() - 5);
  birth.setDate(birth.getDate() - 10);

  const created = await request.post(`${API}/people`, {
    headers,
    data: { name: 'Birthday Betty', birthDate: isoDate(birth) },
  });
  expect(created.ok()).toBeTruthy();
  const person = await created.json();

  await signIn(page);
  await page.goto(`/people/${person.id}`);

  const age = page.getByTestId('person-age');
  await expect(age).toBeVisible();
  await expect(age).toHaveText('Age 5');
  await highlight(page, age, 'New: age from birthday');
  await shot(page, 'Person page shows the age next to the birth date', { focus: age });
});
