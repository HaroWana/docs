import { expect, test } from '@playwright/test';

import {
  BROWSERS,
  createDoc,
  keyCloakSignIn,
  randomName,
  verifyDocName,
} from './utils-common';
import { createRootSubPage } from './utils-sub-pages';

test.describe('Document create member', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('it selects 2 users and 1 invitation', async ({ page, browserName }) => {
    const inputFill = 'user ';
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/users/?q=${encodeURIComponent(inputFill)}`) &&
        response.status() === 200,
    );
    await createDoc(page, 'select-multi-users', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();

    const inputSearch = page.getByRole('combobox', {
      name: 'Quick search input',
    });
    await expect(inputSearch).toBeVisible();

    // Select user 1 and verify tag
    await inputSearch.fill(inputFill);
    const response = await responsePromise;
    const users = (await response.json()) as {
      email: string;
      full_name?: string | null;
    }[];

    const list = page.getByTestId('doc-share-add-member-list');
    await expect(list).toBeHidden();
    const quickSearchContent = page.getByTestId('doc-share-quick-search');
    await quickSearchContent
      .getByTestId(`search-user-row-${users[0].email}`)
      .click();

    await expect(list).toBeVisible();
    await expect(
      list.getByTestId(`doc-share-add-member-${users[0].email}`),
    ).toBeVisible();
    await expect(
      list.getByText(`${users[0].full_name || users[0].email}`),
    ).toBeVisible();

    // Select user 2 and verify tag
    await inputSearch.fill(inputFill);
    await quickSearchContent
      .getByTestId(`search-user-row-${users[1].email}`)
      .click();

    await expect(
      list.getByTestId(`doc-share-add-member-${users[1].email}`),
    ).toBeVisible();
    await expect(
      list.getByText(`${users[1].full_name || users[1].email}`),
    ).toBeVisible();

    // Select email and verify tag
    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await quickSearchContent.getByText(email).click();
    await expect(list.getByText(email)).toBeVisible();

    // Check roles are displayed
    await list.getByLabel('doc-role-dropdown').click();
    await expect(page.getByLabel('Reader')).toBeVisible();
    await expect(page.getByLabel('Editor')).toBeVisible();
    await expect(page.getByLabel('Owner')).toBeVisible();
    await expect(page.getByLabel('Administrator')).toBeVisible();

    // Validate
    await page.getByLabel('Administrator').click();
    await page.getByRole('button', { name: 'Invite' }).click();

    // Check invitation added
    await expect(
      quickSearchContent.getByText('Pending invitations'),
    ).toBeVisible();
    await expect(quickSearchContent.getByText(email).first()).toBeVisible();

    // Check user added
    await expect(page.getByText('Share with 3 users')).toBeVisible();
    await expect(
      quickSearchContent
        .getByText(users[0].full_name || users[0].email)
        .first(),
    ).toBeVisible();
    await expect(
      quickSearchContent.getByText(users[0].email).first(),
    ).toBeVisible();
    await expect(
      quickSearchContent.getByText(users[1].email).first(),
    ).toBeVisible();
    await expect(
      quickSearchContent
        .getByText(users[1].full_name || users[1].email)
        .first(),
    ).toBeVisible();
  });

  test('it try to add twice the same invitation', async ({
    page,
    browserName,
  }) => {
    await createDoc(page, 'invitation-twice', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();

    const inputSearch = page.getByRole('combobox', {
      name: 'Quick search input',
    });

    const [email] = randomName('test@test.fr', browserName, 1);
    await inputSearch.fill(email);
    await page.getByTestId(`search-user-row-${email}`).click();

    // Choose a role
    const container = page.getByTestId('doc-share-add-member-list');
    await container.getByLabel('doc-role-dropdown').click();
    await page.getByLabel('Owner').click();

    const responsePromiseCreateInvitation = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 201,
    );
    await page.getByRole('button', { name: 'Invite' }).click();

    // Check invitation sent

    const responseCreateInvitation = await responsePromiseCreateInvitation;
    expect(responseCreateInvitation.ok()).toBeTruthy();

    await inputSearch.fill(email);
    await page.getByTestId(`search-user-row-${email}`).click();

    // Choose a role
    await container.getByLabel('doc-role-dropdown').click();
    await page.getByLabel('Owner').click();

    const responsePromiseCreateInvitationFail = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 400,
    );

    await page.getByRole('button', { name: 'Invite' }).click();
    await expect(
      page.getByText(`"${email}" is already invited to the document.`),
    ).toBeVisible();
    const responseCreateInvitationFail =
      await responsePromiseCreateInvitationFail;
    expect(responseCreateInvitationFail.ok()).toBeFalsy();
  });

  test('it manages invitation', async ({ page, browserName }) => {
    await createDoc(page, 'user-invitation', browserName, 1);

    await page.getByRole('button', { name: 'Share' }).click();

    const inputSearch = page.getByRole('combobox', {
      name: 'Quick search input',
    });

    const email = randomName('test@test.fr', browserName, 1)[0];
    await inputSearch.fill(email);
    await page.getByTestId(`search-user-row-${email}`).click();

    // Choose a role
    const container = page.getByTestId('doc-share-add-member-list');
    await container.getByLabel('doc-role-dropdown').click();
    await page.getByLabel('Administrator').click();

    const responsePromiseCreateInvitation = page.waitForResponse(
      (response) =>
        response.url().includes('/invitations/') && response.status() === 201,
    );

    await page.getByRole('button', { name: 'Invite' }).click();

    // Check invitation sent
    const responseCreateInvitation = await responsePromiseCreateInvitation;
    expect(responseCreateInvitation.ok()).toBeTruthy();

    const listInvitation = page.getByTestId('doc-share-quick-search');
    const userInvitation = listInvitation.getByTestId(
      `doc-share-invitation-row-${email}`,
    );
    await expect(userInvitation).toBeVisible();

    await userInvitation.getByLabel('doc-role-dropdown').click();
    await page.getByLabel('Reader').click();

    const moreActions = userInvitation.getByRole('button', {
      name: 'more_horiz',
    });
    await moreActions.click();

    await page.getByLabel('Delete').click();

    await expect(userInvitation).toBeHidden();
  });
});

test.describe('Document create member: Multiple login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('It creates a member from a request coming from a 403 page', async ({
    page,
    browserName,
  }) => {
    test.slow();

    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docTitle] = await createDoc(
      page,
      'Member access request',
      browserName,
      1,
    );

    await verifyDocName(page, docTitle);

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    const otherBrowser = BROWSERS.find((b) => b !== browserName);

    await keyCloakSignIn(page, otherBrowser!);

    await expect(
      page.getByRole('link', { name: 'Docs Logo Docs' }),
    ).toBeVisible();

    await page.goto(urlDoc);

    await expect(
      page.getByText('Insufficient access rights to view the document.'),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole('button', { name: 'Request access' }).click();

    await expect(
      page.getByText('Your access request for this document is pending.'),
    ).toBeVisible();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    await expect(
      page.getByRole('link', { name: 'Docs Logo Docs' }),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.goto(urlDoc);

    await page.getByRole('button', { name: 'Share' }).click();

    await expect(page.getByText('Access Requests')).toBeVisible();
    await expect(page.getByText(`E2E ${otherBrowser}`)).toBeVisible();

    const emailRequest = `user@${otherBrowser}.test`;
    await expect(page.getByText(emailRequest)).toBeVisible();
    const container = page.getByTestId(
      `doc-share-access-request-row-${emailRequest}`,
    );
    await container.getByLabel('doc-role-dropdown').click();
    await page.getByLabel('Administrator').click();
    await container.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByText('Access Requests')).toBeHidden();
    await expect(page.getByText('Share with 2 users')).toBeVisible();
    await expect(page.getByText(`E2E ${otherBrowser}`)).toBeVisible();
  });

  test('It cannot request member access on child doc on a 403 page', async ({
    page,
    browserName,
  }) => {
    test.slow();

    await page.goto('/');
    await keyCloakSignIn(page, browserName);

    const [docParent] = await createDoc(
      page,
      'Block Member access request on child doc - parent',
      browserName,
      1,
    );

    await verifyDocName(page, docParent);

    await createRootSubPage(
      page,
      browserName,
      'Block Member access request on child doc - child',
    );

    const urlDoc = page.url();

    await page
      .getByRole('button', {
        name: 'Logout',
      })
      .click();

    const otherBrowser = BROWSERS.find((b) => b !== browserName);

    await keyCloakSignIn(page, otherBrowser!);

    await expect(
      page.getByRole('link', { name: 'Docs Logo Docs' }),
    ).toBeVisible({
      timeout: 10000,
    });

    await page.goto(urlDoc);

    await expect(
      page.getByText(
        "You're currently viewing a sub-document. To gain access, please request permission from the main document.",
      ),
    ).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByRole('button', { name: 'Request access' }),
    ).toBeHidden();
  });
});
