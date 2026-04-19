/**
 * E2E tests — Game iframe (frames/game.html)
 *
 * Tests cover the canvas rendering, game-over overlay for a crash landing, a
 * successful landing using the Level 1 reference solution, and postMessage
 * synchronisation between the game iframe and the level selector.
 */

import { test, expect } from "@playwright/test";

// ── Canvas / iframe boot ─────────────────────────────────────────────────

test.describe("Game iframe", () => {
  test("canvas element is rendered after clicking Run", async ({ page }) => {
    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    await page.locator("#run").click();

    const iframeLocator = page.locator("#game-container iframe");
    await expect(iframeLocator).toBeVisible({ timeout: 10_000 });

    const frame = page.frame({ url: /game\.html/ });
    await expect(frame!.locator("canvas#game")).toBeVisible({ timeout: 10_000 });
  });

  test("game iframe posts levelLoaded and editor syncs level selector", async ({ page }) => {
    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    // The selector starts at index 0; clicking Run loads that same level.
    // After the iframe boots it fires postMessage({ type: "levelLoaded", index: 0 }).
    // The editor listens and sets levelSelect.value = "0".
    await page.locator("#run").click();

    // Wait for the iframe to load and post its message
    await page.locator("#game-container iframe").waitFor();

    // Give the message a moment to propagate
    await page.waitForFunction(
      () => (document.getElementById("level-select") as HTMLSelectElement | null)?.value === "0",
      { timeout: 10_000 },
    );

    const selectedValue = await page.locator("#level-select").inputValue();
    expect(selectedValue).toBe("0");
  });
});

// ── Game outcomes ─────────────────────────────────────────────────────────

test.describe("Game outcomes", () => {
  /**
   * Inject code that never fires any engine on Level 10 (Hoverslam).
   * That level starts at initialVelocity.y = 3.0 with maxLandingVelocity = 0.5,
   * so free-fall alone guarantees a crash.
   */
  test("crash landing shows a failure overlay inside the iframe", async ({ page }) => {
    await page.addInitScript(() => {
      // Code that intentionally does nothing — rocket free-falls and crashes
      localStorage.setItem("lander:code:level10", "// intentional crash — no engine");
    });

    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    // Select Level 10 (index 10) so the free-fall definitely exceeds maxLandingVelocity
    await page.locator("#level-select").selectOption("10");

    await page.locator("#run").click();
    await page.locator("#game-container iframe").waitFor();

    const frame = page.frame({ url: /game\.html/ });

    // Wait for the failure overlay to appear inside the game iframe
    await expect(frame!.locator("#__overlay")).toBeVisible({ timeout: 30_000 });

    // The heading should contain "failed" (e.g. "Hello, Moon failed")
    await expect(frame!.locator("#__overlay h2")).toContainText("failed");
  });

  /**
   * Inject the Level 1 reference solution — the rocket should land safely
   * and display a success overlay. Allow up to 45 s for the physics to play
   * out at real-time canvas speed.
   */
  test("Level 1 solution lands successfully and shows a success overlay", async ({ page }) => {
    const level1Solution = `\
setInterval(() => {
  const angle = falcon9.angle;
  const spin  = falcon9.rotationalMomentum;
  falcon9.rotateLeft  = angle > 0.05 || spin > 0.5;
  falcon9.rotateRight = angle < -0.05 || spin < -0.5;
  falcon9.fireBoosterEngine = falcon9.velocity.y > 1.0;
}, 16);`;

    await page.addInitScript((code) => {
      localStorage.setItem("lander:code:level1", code);
    }, level1Solution);

    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });
    await page.locator("#run").click();
    await page.locator("#game-container iframe").waitFor();

    const frame = page.frame({ url: /game\.html/ });

    await expect(frame!.locator("#__overlay")).toBeVisible({ timeout: 45_000 });
    await expect(frame!.locator("#__overlay h2")).toContainText("complete");
  });
});
