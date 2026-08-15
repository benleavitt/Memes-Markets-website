import { type Page, expect, test } from "@playwright/test";

/**
 * Put the site on air for a test.
 *
 * The player and the Watch live CTA only exist while the show is broadcasting,
 * so a suite that does not say otherwise sees neither — there are no Twitch
 * credentials in CI and /api/live-status correctly answers "off air".
 *
 * Stubbing the route rather than setting FORCE_LIVE on the dev server keeps each
 * test's intent visible in the test, and keeps it working against whatever
 * server happens to be running (playwright.config reuses an existing one).
 *
 * The Twitch embed is stubbed too. Nothing here is testing Twitch's player, and
 * letting it load makes the suite depend on a third party's CDN being up.
 */
async function goLive(page: Page) {
  await page.route("**/api/live-status", (route) =>
    route.fulfill({
      json: { live: true, title: "Test broadcast", viewers: 1234, source: "forced" },
    }),
  );
  await page.route("https://player.twitch.tv/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>stub</title>",
    }),
  );
}

/**
 * The load-bearing test.
 *
 * The whole reason this project is on the Next.js App Router is that the floating
 * player must keep playing across a Home <-> About navigation. That requirement
 * is what ruled out Astro. If it ever regresses, the framework choice is no
 * longer paying for itself and we should know immediately.
 *
 * Asserting "the player is visible on both pages" would NOT catch a regression:
 * a component that unmounts and remounts also ends up visible on both. So we
 * stamp the live DOM node before navigating and check the stamp survived. React
 * cannot preserve it across an unmount, because a remount builds a new node.
 */
test.describe("floating live player", () => {
  test("survives Home to About without remounting", async ({ page }) => {
    await goLive(page);
    await page.goto("/");

    const player = page.getByTestId("live-player");
    await expect(player).toBeVisible();

    // Stamp the node that exists right now.
    await player.evaluate((el) => {
      (el as HTMLElement).dataset.e2eStamp = "original-instance";
    });

    // Client-side navigation, the way a visitor does it.
    await page.getByRole("link", { name: "About", exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    // The About h1 is the show name, not the word "About" — that is the eyebrow
    // above it. This assertion is only here to prove the new route actually
    // rendered before the stamp is checked.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Memes & Markets",
    );

    // Same node, therefore never unmounted, therefore a stream would still be playing.
    await expect(page.getByTestId("live-player")).toHaveAttribute(
      "data-e2e-stamp",
      "original-instance",
    );

    // And back again.
    await page.goBack();
    await expect(page).toHaveURL(/localhost:3000\/$/);
    await expect(page.getByTestId("live-player")).toHaveAttribute(
      "data-e2e-stamp",
      "original-instance",
    );
  });

  test("dismiss hides it and the choice sticks for the visit", async ({ page }) => {
    await goLive(page);
    await page.goto("/");
    const player = page.getByTestId("live-player");
    await expect(player).toBeVisible();

    await page.getByRole("button", { name: "Dismiss player" }).click();
    await expect(player).toHaveCount(0);

    // Dismissal is per-visit, so it must survive a navigation but not a new session.
    await page.getByRole("link", { name: "About", exact: true }).click();
    await expect(page.getByTestId("live-player")).toHaveCount(0);
  });

  /**
   * The other half of "only when live", and the half that actually regressed
   * before: both surfaces used to render unconditionally. Off air is the default
   * state of the site for most of the week, so this is the common case, not the
   * edge case.
   */
  test("neither the player nor the CTA exists off air", async ({ page }) => {
    await page.route("**/api/live-status", (route) =>
      route.fulfill({ json: { live: false, source: "twitch" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("live-player")).toHaveCount(0);

    // The CTA lives inside the info panel, so the panel has to be open to know.
    await page.getByRole("button", { name: "More info" }).click();
    await expect(page.locator("dialog.mm-panel")).toBeVisible();
    await expect(page.getByTestId("live-cta")).toHaveCount(0);
  });

  /**
   * The embed used to hardcode `parent=localhost&parent=memesandmarkets.com`, and
   * Twitch refuses to render whenever the embedding host is not in that list. The
   * site is on neither: production is a *.vercel.app address until a domain is
   * bought, and memesandmarkets.com serves the Substack. So this card drew its
   * border, title and viewer count around Twitch's refusal notice on every
   * environment that was not a laptop — and nothing caught it, because goLive()
   * above stubs the Twitch player out of the suite on purpose.
   *
   * Asserting on the src rather than on what renders keeps that stub in place: the
   * claim being tested is "we asked for the right thing", which is exactly the
   * part that was wrong.
   */
  test("the embed names the host it is actually embedded on", async ({ page }) => {
    await goLive(page);
    await page.goto("/");

    const embed = page.locator('iframe[title="Memes & Markets live stream"]');
    await expect(embed).toBeVisible();

    const src = new URL((await embed.getAttribute("src")) ?? "");
    expect(src.origin).toBe("https://player.twitch.tv");
    expect(src.searchParams.getAll("parent")).toContain(new URL(page.url()).hostname);
  });

  test("the CTA appears in the panel once the show is on air", async ({ page }) => {
    await goLive(page);
    await page.goto("/");

    await page.getByRole("button", { name: "More info" }).click();
    const cta = page.getByTestId("live-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /youtube\.com\/@MemesandMarketsPod\/live/);
  });
});

test.describe("home", () => {
  test("renders the orbit as real links", async ({ page }) => {
    await page.goto("/");

    // Twelve cards on the belt, each a real link — the accessibility argument for
    // building the sphere out of DOM rather than canvas. Since the plain episode
    // list was removed, this IS the route to the episodes, so it has to hold.
    await expect(page.locator(".mm-orbit-slot")).toHaveCount(12);
    await expect(page.locator(".mm-orbit-slot a").first()).toHaveAttribute(
      "href",
      /youtube/,
    );

    // Exactly one h1, and the disclaimer is present verbatim. Scoped to <footer>:
    // the More info panel carries the same sentence, so an unscoped getByText
    // matches twice and trips strict mode.
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page
        .locator("footer")
        .getByText(
          "For education and entertainment only. Not financial, legal, tax, or investment advice.",
        ),
    ).toBeVisible();
  });

  /**
   * The regression this guards against was invisible to every other assertion:
   * the cards were real anchors with correct hrefs and hit-tested correctly, but
   * clicking one did nothing, because the belt captured the pointer on
   * pointerdown and the browser fired `click` on the belt instead of the anchor.
   * "It is a link with an href" is not the same claim as "it opens".
   */
  /**
   * The bug the test above could not see, because that one disables the drift.
   *
   * Every card on this belt is always moving, so clicking one means aiming at a
   * moving target and the pointer travels a few pixels doing it. The drag
   * threshold was 5px, which is inside the noise of an ordinary click — so a
   * normal click crossed it, turned the belt a little, and had its click
   * swallowed. Reported as "I get to spin the orbit but not go to the video".
   *
   * Deliberately runs with the drift LIVE and asserts on the numbers either side
   * of the threshold, because "does a click work" and "does a drag not open
   * anything" are the same question asked at two distances.
   */
  for (const travel of [0, 6, 10]) {
    test(`a click that wobbles ${travel}px still opens the card`, async ({ page }) => {
      await page.goto("/");
      const card = page.locator(".mm-orbit-slot a").first();
      const box = (await card.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
      const x = box.x + box.width / 2;
      const y = box.y + 40;

      const popupPromise = page.waitForEvent("popup");
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(80);
      if (travel) await page.mouse.move(x + travel, y, { steps: 3 });
      await page.mouse.up();

      const popup = await popupPromise;
      expect(popup.url()).toMatch(/youtube\.com/);
      await popup.close();
    });
  }

  /**
   * The other side of the same line. Past the threshold it must be a drag: the
   * belt turns and nothing opens. Without this, "make clicking work" could be
   * satisfied by removing the swallow entirely and breaking every drag.
   */
  test("a deliberate drag turns the belt and opens nothing", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(".mm-orbit-slot a").first();
    const belt = page.locator(".mm-orbit-belt");
    const box = (await card.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
    const x = box.x + box.width / 2;
    const y = box.y + 40;

    let opened = false;
    page.once("popup", () => {
      opened = true;
    });

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(80);
    await page.mouse.move(x - 40, y, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(1200);

    expect(opened).toBe(false);
    const nudge = await belt.evaluate((el) => el.style.getPropertyValue("--nudge"));
    expect(Number.parseFloat(nudge)).not.toBe(0);
  });

  /**
   * A touch browser leaves :hover stuck on whatever was tapped, so the
   * hover-to-pause rule used to stop the belt permanently the first time a phone
   * user touched a card. The pause is now behind `@media (hover: hover)`, and
   * touch pauses only for the length of the press.
   */
  test("the belt is frozen while pressed and drifts again after release", async ({
    page,
  }) => {
    await page.goto("/");
    const belt = page.locator(".mm-orbit-belt");
    const card = page.locator(".mm-orbit-slot a").first();
    const box = (await card.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };

    await page.mouse.move(box.x + box.width / 2, box.y + 40);
    await page.mouse.down();
    await expect(belt).toHaveAttribute("data-pressing", "true");
    await expect(belt).toHaveCSS("animation-play-state", "paused");

    await page.mouse.up();
    await expect(belt).not.toHaveAttribute("data-pressing", "true");
  });

  test("an orbit card opens on click, but not at the end of a drag", async ({ page }) => {
    // Freezes the drift, so the card cannot slide out from under the pointer
    // between measuring it and pressing it.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const card = page.locator(".mm-orbit-slot a").first();
    const [popup] = await Promise.all([page.waitForEvent("popup"), card.click()]);
    expect(popup.url()).toMatch(/youtube\.com/);
    await popup.close();

    // Now drag from on top of a card. The belt must turn and nothing must open.
    const belt = page.locator(".mm-orbit-belt");
    const box = (await card.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
    const x = box.x + box.width / 2;
    const y = box.y + 60;

    let openedDuringDrag = false;
    page.once("popup", () => {
      openedDuringDrag = true;
    });

    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(x - i * 12, y);
    await page.mouse.up();
    await page.waitForTimeout(500);

    expect(openedDuringDrag).toBe(false);
    await expect(belt).toHaveAttribute("style", /--nudge/);
    const nudge = await belt.evaluate((el) => el.style.getPropertyValue("--nudge"));
    expect(Number.parseFloat(nudge)).not.toBe(0);
  });

  test("more info opens a panel and escape closes it", async ({ page }) => {
    await page.goto("/");

    const panel = page.locator("dialog.mm-panel");
    await expect(panel).toBeHidden();

    await page.getByRole("button", { name: "More info" }).click();
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Hosted by" })).toBeVisible();
    await expect(
      panel.getByRole("heading", { name: "Press & appearances" }),
    ).toBeVisible();

    // The page behind must not scroll while the panel is up.
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  });

  /**
   * Deliberately only exercises the address the route rejects locally, so the
   * suite never posts to Substack. Everything up to that point — the form, the
   * fetch, the route, the error rendering — is the same code path a real signup
   * takes; only the upstream call is skipped.
   */
  test("the newsletter box reports a bad address without leaving the page", async ({
    page,
  }) => {
    await page.goto("/");

    const form = page.locator("footer form");
    await form.scrollIntoViewIfNeeded();
    await expect(form.getByRole("button", { name: "Subscribe" })).toBeVisible();

    await form.getByPlaceholder("name@email.com").fill("definitely-not-an-email");
    await form.getByRole("button", { name: "Subscribe" }).click();

    await expect(form.getByText(/does not look like an email/i)).toBeVisible();
    // Still on the homepage: the fetch answered in place rather than navigating.
    await expect(page).toHaveURL(/localhost:3000\/$/);
    await expect(form.getByPlaceholder("name@email.com")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("does not scroll sideways at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
