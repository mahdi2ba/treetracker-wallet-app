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

// Drive Keycloak's hosted login page (the app /login redirects here), then wait
// for the app to load logged-in.
async function keycloakLogin(username: string, password: string) {
  await $("#username").waitForDisplayed({ timeout: 20000 });
  await $("#username").setValue(username);
  await $("#password").setValue(password);
  await $("#kc-login").click();
  await $("[data-test=navigation-home]").waitForDisplayed({ timeout: 20000 });
}

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
    timeout: 100000,
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
  await $('[data-test="signup-username"]').setValue(data.username);
  await $('[data-test="signup-email"]').setValue(data.email);
  await $('[data-test="signup-password"]').setValue(data.password);
});

When(
  /^I fill in the registration form with \[random user name\]@greenstand\.org password:\s*(.+)$/,
  async (password: string) => {
    const ts = Date.now();
    const username = `user${ts}`;
    const email = `${username}@greenstand.org`;

    // Remember the credentials so a later step can log in as this fresh user.
    registeredUsername = username;
    registeredPassword = password;

    // Keycloak's hosted registration page (the app redirected here). Wait for the
    // form to be fully loaded/stable, then fill the standard fields directly.
    await $("#kc-register-form").waitForExist({ timeout: 25000 });
    await $("#username").waitForDisplayed({ timeout: 25000 });
    await $("#firstName").setValue("Test");
    await $("#lastName").setValue("User");
    await $("#username").setValue(username);
    await $("#email").setValue(email);
    await $("#password").setValue(password);
    await $("#password-confirm").setValue(password);
  },
);

When(/^I click on the register button$/, async () => {
  const candidates = [
    "#kc-register-form input[type=submit]",
    "#kc-register-form button[type=submit]",
    "input[type=submit]",
    "button[type=submit]",
  ];
  for (const sel of candidates) {
    const el = await $(sel);
    if (await el.isExisting()) {
      try {
        await el.click();
      } catch {
        // Headed Keycloak layout can overlap the full-width submit button so the
        // native click is "intercepted". A JS click dispatches directly on the
        // node and bypasses the hit-test.
        await browser.execute((node: any) => node.click(), el);
      }
      return;
    }
  }
  throw new Error("Keycloak register submit button not found");
});

When(/^I click on the social media login button$/, async table => {
  const data = table.rowsHash();
  await $(`button*=Login with ${data.social_media}`).click();
});

Then(/^I should see a confirmation message$/, async () => {
  // Keycloak registers the user, auto-logs them in, and redirects back to the
  // app — so success = landing in the app logged in (bottom nav visible).
  await $("[data-test=navigation-home]").waitForDisplayed({
    timeout: 30000,
    timeoutMsg: "Expected to be logged in (navigation-home) after registration",
  });
});
//#endregion REGISTER

When("I login with an account", async () => {
  await keycloakLogin("testuser1", "kebWaf-beqto0-nymbyb");
});

When("I create a new wallet", async () => {
  const ts = Date.now();
  stepState.walletName = `wallet${ts}`;
  // Wait for the wallet page to be ready (after the full-page navigation).
  await $("[data-test=wallet-create-open]").waitForDisplayed({
    timeout: 15000,
  });
  await $("[data-test=wallet-create-open]").click();
  // Wallet creation drawer takes some time to open, so we wait for the input to be displayed
  await $('[data-test="wallet-create-name"]').waitForDisplayed({
    timeout: 30000,
  });
  await $('[data-test="wallet-create-name"]').setValue(stepState.walletName);
  await $('[data-test="wallet-create-description"]').setValue("desc");
  await $('[data-test="wallet-create-submit"]').click();
});

// Log in as the user registered earlier in the scenario (fresh user → first wallet).
When("I login with the registered account", async () => {
  await keycloakLogin(registeredUsername, registeredPassword);
});

// Click the wallet in the list → navigate to its details page (basic info + token list).
When(/^I click on the wallet to view its details$/, async () => {
  await $(`[data-test=wallet-item-name-${stepState.walletName}]`).click();
  await $("[data-test=wallet-details-page]").waitForDisplayed({
    timeout: 15000,
  });
  await $("[data-test=token-list]").waitForDisplayed({ timeout: 15000 });
});

// Id of the token opened on the details page, shared with the map-URL assertion.
let selectedTokenId = "";

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

// Click the first token in the list → navigate to that token's details page.
When(
  /^I click the token item on the list of tokens in the wallet details page$/,
  async () => {
    const item = await $("[data-test^='token-item-']");
    await item.waitForDisplayed({ timeout: 15000 });
    // Remember which token we're opening so later steps can assert the map URL.
    const dt = (await item.getAttribute("data-test")) || "";
    selectedTokenId = dt.replace("token-item-", "");
    await item.click();
    await $("[data-test=token-details-page]").waitForDisplayed({
      timeout: 15000,
    });
  },
);

Then(/^I should see the token details page with token info$/, async () => {
  await expect($("[data-test=token-details-page]")).toBeDisplayed();
  const info = $("[data-test=token-details-id]");
  await info.waitForDisplayed({ timeout: 15000 });
  await expect(info).toHaveText(selectedTokenId, { containing: true });
});

// Click the location icon — it's an anchor with target=_blank, so it opens a new tab.
When(/^I click the location icon on the token details page$/, async () => {
  await $("[data-test=token-location-link]").click();
});

Then(
  /^I should see the map page with the location of the token in a new tab$/,
  async () => {
    // A new tab opens for the map. Headed Chrome also exposes devtools:// tabs as
    // window handles, so don't assume which handle is the map — scan every handle
    // and land on the one whose URL carries /tokens/<id>. (The external map app may
    // return an error page, but the URL still carries the token id.)
    await browser.waitUntil(
      async () => {
        const handles = await browser.getWindowHandles();
        for (const h of handles) {
          await browser.switchToWindow(h);
          if ((await browser.getUrl()).includes("/tokens/" + selectedTokenId)) {
            return true;
          }
        }
        return false;
      },
      {
        timeout: 20000,
        interval: 1000,
        timeoutMsg:
          "No tab navigated to the token map page (/tokens/" +
          selectedTokenId +
          ")",
      },
    );
  },
);
