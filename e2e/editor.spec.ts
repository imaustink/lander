/**
 * E2E tests — Editor page (index.html)
 *
 * Tests cover the static shell, level selector population, Show Solution
 * dialog interactions, Run button creating the game iframe, and per-level
 * code persistence via localStorage.
 */

import { test, expect } from "@playwright/test";

test.describe("Editor page", () => {
  test("loads with the correct title and header", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Moon Lander");
    await expect(page.locator("#header h1")).toHaveText("Moon Lander");
    await expect(page.locator("#header-badge")).toBeVisible();
  });

  test("level selector is populated with 11 levels", async ({ page }) => {
    await page.goto("/");
    const options = page.locator("#level-select option");
    await expect(options).toHaveCount(11);
    // First option should reference Level 0 (Tutorial)
    await expect(options.first()).toContainText("0.");
    // Last option should reference Level 10
    await expect(options.last()).toContainText("10.");
  });

  test("Run and Show Solution buttons are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#run")).toBeVisible();
    await expect(page.locator("#show-solution")).toBeVisible();
  });

  test("Monaco editor container is rendered", async ({ page }) => {
    await page.goto("/");
    // Wait for Monaco to initialise — the .monaco-editor div appears after AMD load
    await expect(page.locator("#editor .monaco-editor")).toBeVisible({ timeout: 20_000 });
  });

  test("game placeholder is shown before Run is clicked", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#game-placeholder")).toBeVisible();
  });
});

test.describe("Show Solution dialog", () => {
  test("opens when Show Solution is clicked", async ({ page }) => {
    await page.goto("/");
    await page.locator("#show-solution").click();
    await expect(page.locator("#confirm-solution")).toBeVisible();
  });

  test("closes without changing code when Cancel is clicked", async ({ page }) => {
    await page.goto("/");

    // Read current editor text before opening dialog
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });
    const before = await page.evaluate(() =>
      (window as unknown as Record<string, { getValue(): string }>).__editor?.getValue()
    );

    await page.locator("#show-solution").click();
    await page.locator("#dialog-cancel").click();

    await expect(page.locator("#confirm-solution")).toBeHidden();

    const after = await page.evaluate(() =>
      (window as unknown as Record<string, { getValue(): string }>).__editor?.getValue()
    );
    expect(after).toBe(before);
  });

  test("closes and replaces editor content when confirmed", async ({ page }) => {
    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    await page.locator("#show-solution").click();
    await page.locator("#dialog-confirm").click();

    await expect(page.locator("#confirm-solution")).toBeHidden();

    // After confirming the solution code should be present in the editor
    const editorText = await page.evaluate(() =>
      (window as unknown as Record<string, { getValue(): string }>).__editor?.getValue() ?? ""
    );
    // The Level 1 solution always contains "fireBoosterEngine"
    expect(editorText).toContain("fireBoosterEngine");
  });
});

test.describe("Level selector", () => {
  test("switching levels restores per-level code from localStorage", async ({ page }) => {
    const CUSTOM_CODE = "// my custom code for level 1";

    // Pre-seed localStorage before the page loads
    await page.addInitScript(() => {
      localStorage.setItem("lander:code:level0", "// my custom code for level 1");
    });

    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    // Navigate to level 2, then back to level 1 to confirm persistence
    await page.locator("#level-select").selectOption("1");
    await page.locator("#level-select").selectOption("0");

    const editorText = await page.evaluate(() =>
      document.querySelector<HTMLTextAreaElement>(".monaco-editor textarea")?.value ?? ""
    );
    expect(editorText).toContain(CUSTOM_CODE);
  });
});

test.describe("Auto-save", () => {
  test("typing in the editor persists code to localStorage", async ({ page }) => {
    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    const CUSTOM_SNIPPET = "// autosave-test-marker";

    // Set editor content programmatically (triggers onDidChangeModelContent)
    await page.evaluate((code) => {
      (window as unknown as Record<string, { setValue(v: string): void }>).__editor.setValue(code);
    }, CUSTOM_SNIPPET);

    // localStorage should already contain the new code
    const stored = await page.evaluate(() =>
      localStorage.getItem("lander:code:level0")
    );
    expect(stored).toBe(CUSTOM_SNIPPET);
  });

  test("auto-saved code survives a page reload", async ({ page }) => {
    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    const CUSTOM_SNIPPET = "// reload-persist-test";

    await page.evaluate((code) => {
      (window as unknown as Record<string, { setValue(v: string): void }>).__editor.setValue(code);
    }, CUSTOM_SNIPPET);

    // Reload and verify the editor restores the saved code
    await page.reload();
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    const editorText = await page.evaluate(() =>
      (window as unknown as Record<string, { getValue(): string }>).__editor.getValue()
    );
    expect(editorText).toBe(CUSTOM_SNIPPET);
  });
});

test.describe("Run button", () => {
  test("clicking Run creates a game iframe", async ({ page }) => {
    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    await page.locator("#run").click();

    // An <iframe> inside #game-container should appear
    const iframe = page.locator("#game-container iframe");
    await expect(iframe).toBeVisible({ timeout: 10_000 });
    const src = await iframe.getAttribute("src");
    expect(src).toContain("game.html");
  });

  test("clicking Run again replaces the previous iframe", async ({ page }) => {
    await page.goto("/");
    await page.locator("#editor .monaco-editor").waitFor({ timeout: 20_000 });

    await page.locator("#run").click();
    await page.locator("#game-container iframe").waitFor();

    await page.locator("#run").click();

    // There should still be exactly one iframe
    const iframes = page.locator("#game-container iframe");
    await expect(iframes).toHaveCount(1);
  });
});
