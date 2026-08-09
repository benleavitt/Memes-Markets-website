import { expect, test } from "@playwright/test";

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
    // The About h1 is the positioning line, not the word "About" — that is the
    // eyebrow above it. This assertion is only here to prove the new route
    // actually rendered before the stamp is checked.
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Web3’s live podcast",
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
    await page.goto("/");
    const player = page.getByTestId("live-player");
    await expect(player).toBeVisible();

    await page.getByRole("button", { name: "Dismiss player" }).click();
    await expect(player).toHaveCount(0);

    // Dismissal is per-visit, so it must survive a navigation but not a new session.
    await page.getByRole("link", { name: "About", exact: true }).click();
    await expect(page.getByTestId("live-player")).toHaveCount(0);
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
    await expect(panel.getByRole("heading", { name: "Selected press" })).toBeVisible();

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
