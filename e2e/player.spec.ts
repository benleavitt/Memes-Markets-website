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
    await expect(page.getByRole("heading", { level: 1 })).toContainText("About");

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
  test("renders the orbit and the always-works episode list", async ({ page }) => {
    await page.goto("/");

    // Twelve cards on the belt, each a real link — the accessibility argument for
    // building the sphere out of DOM rather than canvas.
    await expect(page.locator(".mm-orbit-slot")).toHaveCount(12);
    await expect(page.locator(".mm-orbit-slot a").first()).toHaveAttribute(
      "href",
      /youtube/,
    );

    // The plain list below the fold is the route to the content that always works.
    const list = page.getByRole("heading", { name: "Latest episodes" });
    await expect(list).toBeVisible();

    // Exactly one h1, and the disclaimer is present verbatim.
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(
      page.getByText(
        "For education and entertainment only. Not financial, legal, tax, or investment advice.",
      ),
    ).toBeVisible();
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
