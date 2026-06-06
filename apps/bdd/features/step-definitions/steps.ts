/**
 * steps.ts
 * Sections:
 *  - [COMMON] Shared navigation & generic assertions
 *  - [LOGIN] Login flows
 *  - [REGISTER] Registration flows
 *  - [WALLET] Wallet creation & listing flows
 *  - Add more sections as needed
 */

// ============================================================================
// [COMMON] Shared Steps
// ============================================================================
//#region COMMON

import { Given, When, Then } from "@wdio/cucumber-framework";
import { expect, $ } from "@wdio/globals";

// State object to share data between steps
const stepState: Record<string, string> = {
  walletName: "", // We need unique walletName for each test, so we use a global state object to share the walletName between steps
};

// Credentials of a user registered earlier in the scenario, shared across steps.
let registeredUsername = "";
let registeredPassword = "";

// Map page names to routes
const routes: Record<string, string> = {
  login: "login",
  register: "signup",
  wallet: "wallet",
  // add more as needed
};

// Navigate to a named page (aliased → route)
Given(/^I am on the (\w+) page$/, async (page: string) => {
  const route = routes[page.toLowerCase()];
  if (!route) throw new Error(`Unknown page alias: ${page}`);
  const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  await browser.url(`${base}/${route}`);
});

//#endregion COMMON

// ============================================================================
// [LOGIN] Login flows
// ============================================================================
//#region LOGIN

When(/^I login with (\w+) and (.+)$/, async (username, password) => {
  await $('input[name="username"]').setValue(username);
  await $('input[name="password"]').setValue(password);
  await $('button[type="submit"]').click();
});

Then(/^I should see text (.*)$/, async message => {
  await $("body").waitUntil(
    async () => {
      return (await $("body").getText()).match(new RegExp(message, "i"));
    },
    {
      timeout: 5000,
      timeoutMsg: "Expected message to be displayed after 5s",
    },
  );
});

//#endregion LOGIN

// ============================================================================
// [WALLET] Wallet creation & listing flows
// ============================================================================
//#region WALLET

When(/^I fill in the wallet creation form with valid data$/, async table => {
  const data = table.rowsHash();
  await $('input[name="wallet_name"]').setValue(data.wallet_name);
  await $('input[name="password"]').setValue(data.password);
});

When(/^I click on the create wallet button$/, async () => {
  await $("button*=Create Wallet").click();
});

Then(
  /^I should see a confirmation message that my wallet has been created$/,
  async () => {
    const confirmationText = await $(".confirmation-message").getText();
    expect(confirmationText).toMatch(/Wallet created/i);
  },
);

Then(/^I should see my new wallet in the list of wallets$/, async () => {
  await expect($("[data-test=wallet-list]")).toBeDisplayed();
  const walletItemSelector = `[data-test=wallet-item-name-${stepState.walletName}]`;
  // Wait for the wallet item to be displayed. The create flow awaits a real
  // cloud wallet-API round-trip before the optimistic list update, so 3s was
  // too short in fast/headless runs (the in-flight POST could even be aborted
  // when the assertion failed first). Allow realistic remote latency.
  await $(walletItemSelector).waitForDisplayed({
    timeout: 15000,
    timeoutMsg: `Wallet item with name "${stepState.walletName}" did not appear in the list`,
  });
});

// Verify the post-creation notification (shown for the user's first wallet).
Then(/^An notification saying: "(.*)"$/, async (message: string) => {
  const el = $('[data-test="wallet-create-notification"]');
  await el.waitForDisplayed({
    timeout: 15000,
    timeoutMsg: "wallet-creation notification not shown",
  });
  await browser.waitUntil(async () => (await el.getText()).includes(message), {
    timeout: 10000,
    timeoutMsg: "wallet-creation notification text did not match",
  });
});

// ============================================================================
// [REGISTER] Registration flows
// ============================================================================
//#region REGISTER

When(/^I fill in the registration form with valid data$/, async table => {
  const data = table.rowsHash();
  await $('[data-test="signup-username"] input').setValue(data.username);
  await $('[data-test="signup-email"] input').setValue(data.email);
  await $('[data-test="signup-password"] input').setValue(data.password);
});

When(
  /^I fill in the registration form with \[random user name\]@greenstand\.org password:\s*(.+)$/,
  async (password: string) => {
    const ts = Date.now();
    const username = `user${ts}`;
    const email = `${username}@greenstand.org`;

    // Wait for form to be ready and target the actual input elements inside the containers
    await $('[data-test="signup-username"] input').waitForDisplayed({
      timeout: 10000,
    });
    await $('[data-test="signup-email"] input').waitForDisplayed({
      timeout: 10000,
    });
    await $('[data-test="signup-password"] input').waitForDisplayed({
      timeout: 10000,
    });

    // Remember the credentials so a later step can log in as this fresh user.
    registeredUsername = username;
    registeredPassword = password;

    // Set values on the actual input elements
    await $('[data-test="signup-username"] input').setValue(username);
    await $('[data-test="signup-email"] input').setValue(email);
    await $('[data-test="signup-password"] input').setValue(password);
  },
);

When(/^I click on the register button$/, async () => {
  const candidates = [
    '[data-test="signup-submit-button"]',
    'form[data-test="signup-form"] button[type="submit"]',
    'button[type="submit"]',
  ];
  for (const sel of candidates) {
    const el = await $(sel);
    if (await el.isExisting()) {
      await el.click();
      return;
    }
  }
  throw new Error("Register/Sign up submit button not found");
});

When(/^I click on the social media login button$/, async table => {
  const data = table.rowsHash();
  await $(`button*=Login with ${data.social_media}`).click();
});

Then(/^I should see a confirmation message$/, async () => {
  await browser.waitUntil(
    async () => {
      // Check for success message element first
      const successElement = await $('[data-test="signup-success"]');
      if (
        (await successElement.isExisting()) &&
        (await successElement.isDisplayed())
      ) {
        return true;
      }

      // Fallback: check for redirect to login
      const url = await browser.getUrl();
      if (url.includes("/login")) return true;

      return false;
    },
    {
      // Registration round-trips to cloud Keycloak (create user), which can be
      // slow when cold or under parallel load — allow realistic remote latency.
      timeout: 20000,
      timeoutMsg: "Expected success message or redirect to login",
    },
  );
});
//#endregion REGISTER

When("I login with an account", async () => {
  // clean session so the login state is reset
  await browser.execute(() => sessionStorage.clear());
  await $('input[name="username"]').setValue("testuser1");
  await $('input[name="password"]').setValue("kebWaf-beqto0-nymbyb");
  await $('button[type="submit"]').click();
  await expect($("[data-test=navigation-home]")).toExist();
});

When("I create a new wallet", async () => {
  const ts = Date.now();
  stepState.walletName = `wallet${ts}`;
  await $("[data-test=wallet-create-open]").click();
  // Wallet creation drawer takes some time to open, so we wait for the input to be displayed
  await $('[data-test="wallet-create-name"] input').waitForDisplayed({
    timeout: 3000,
  });
  await $('[data-test="wallet-create-name"] input').setValue(
    stepState.walletName,
  );
  await $('[data-test="wallet-create-description"] input').setValue("desc");
  await $('[data-test="wallet-create-submit"]').click();
});

// Log in as the user registered earlier in the scenario (fresh user → first wallet).
When("I login with the registered account", async () => {
  await browser.execute(() => sessionStorage.clear());
  await $('input[name="username"]').setValue(registeredUsername);
  await $('input[name="password"]').setValue(registeredPassword);
  await $('button[type="submit"]').click();
  await expect($("[data-test=navigation-home]")).toExist();
});

// Click the wallet in the list → navigate to its details page (basic info + token list).
When(/^I click on the wallet to view its details$/, async () => {
  await $(`[data-test=wallet-item-name-${stepState.walletName}]`).click();
  await $("[data-test=wallet-details-page]").waitForDisplayed({
    timeout: 15000,
  });
  await $("[data-test=token-list]").waitForDisplayed({ timeout: 15000 });
});

// Verify by counting the tokens listed on the details page. Reload to re-fetch
// while the just-gifted token becomes visible.
Then(
  /^I should see there are (\d+) tokens in my wallet/,
  async (count: string) => {
    const expected = Number(count);
    // Reload and re-fetch getTokens repeatedly until the just-gifted token is
    // visible (the count can lag briefly, more so under parallel load). Crucially,
    // wait after each reload so getTokens finishes fetching+rendering before counting.
    await browser.waitUntil(
      async () => {
        await browser.refresh();
        if (!(await $("[data-test=token-list]").isDisplayed())) return false;
        await browser.pause(2500); // let getTokens fetch + render post-reload
        const n: number = await browser.execute(
          () => document.querySelectorAll("[data-test^='token-item-']").length,
        );
        return n === expected;
      },
      {
        timeout: 90000,
        interval: 1000,
        timeoutMsg: `Expected ${expected} token(s) in wallet "${stepState.walletName}"`,
      },
    );
  },
);
