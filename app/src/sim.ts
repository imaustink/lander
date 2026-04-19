/**
 * Interactive simulation runner — run via:  npm run sim
 *
 * Runs any level's solution (or custom code) through the headless simulator
 * and prints a diagnostic report. Much faster than writing an ad-hoc script.
 *
 * Env vars:
 *   SIM_LEVEL    Level index to run (0–10). Omit to run all levels.
 *   SIM_TRIALS   Trials per level. Default: 1.
 *   SIM_WIDTH    Canvas width in pixels. Default: 800.
 *   SIM_HEIGHT   Canvas height in pixels. Default: 600.
 *   SIM_CODE     Path to a plain-JS file to use as the controller instead of
 *                the level solution. The file is eval'd as-is, so it must use
 *                only JavaScript (no TypeScript syntax).
 *
 * Examples:
 *   npm run sim
 *   SIM_LEVEL=10 npm run sim
 *   SIM_LEVEL=10 SIM_TRIALS=10 npm run sim
 *   SIM_LEVEL=10 SIM_WIDTH=1280 SIM_HEIGHT=960 npm run sim
 *   SIM_LEVEL=10 SIM_CODE=./my-controller.js npm run sim
 */

import { it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { LEVELS } from "./levels.js";
import { runTrials } from "./sim-utils.js";

// ── Config from environment ───────────────────────────────────────────────────

const SIM_LEVEL     = process.env["SIM_LEVEL"] !== undefined ? Number(process.env["SIM_LEVEL"]) : null;
const SIM_TRIALS    = Number(process.env["SIM_TRIALS"] ?? 1);
const SIM_WIDTH     = Number(process.env["SIM_WIDTH"]  ?? 800);
const SIM_HEIGHT    = Number(process.env["SIM_HEIGHT"] ?? 600);
const SIM_CODE_PATH = process.env["SIM_CODE"];

const indices    = SIM_LEVEL !== null ? [SIM_LEVEL] : LEVELS.map((_, i) => i);
const customCode = SIM_CODE_PATH
  ? readFileSync(resolve(process.cwd(), SIM_CODE_PATH), "utf8")
  : undefined;

// ── Formatter helpers ─────────────────────────────────────────────────────────

function fmt(n: number, dp = 2): string {
  return n.toFixed(dp);
}

function passBar(passed: number, total: number): string {
  const filled = Math.round((passed / total) * 20);
  return `[${"#".repeat(filled)}${"-".repeat(20 - filled)}]  ${passed}/${total}`;
}

// ── Per-level report ──────────────────────────────────────────────────────────

function printReport(index: number): void {
  const { config } = LEVELS[index];
  const { passed, trials, passRate, maxFrames, minFrames, results } = runTrials(index, {
    trials:      SIM_TRIALS,
    canvasWidth: SIM_WIDTH,
    canvasHeight: SIM_HEIGHT,
    code:        customCode,
  });

  const codeTag  = customCode ? "  [custom code]" : "";
  const header   = `L${index} — ${config.id}  [${SIM_WIDTH}\xd7${SIM_HEIGHT}]${trials > 1 ? `  \xd7${trials} trials` : ""}${codeTag}`;
  const hr       = "\u2500".repeat(Math.max(header.length, 44));

  console.log(`\n${hr}\n${header}\n${hr}`);

  if (trials > 1) {
    console.log(`  pass rate   ${passBar(passed, trials)}  (${fmt(passRate * 100, 0)}%)`);
    console.log(`  frames      min ${minFrames}  /  max ${maxFrames}`);
    // Surface any single-trial detail for a representative winning run
    const win = results.find(r => r.won);
    if (win) {
      console.log(`  velocity    ${fmt(win.landingVelocity ?? 0)}  (max ${config.maxLandingVelocity})  [sample win]`);
      console.log(`  posX        ${fmt(win.posX, 1)}  (canvas centre ${SIM_WIDTH / 2})`);
    }
  } else {
    const r = results[0];
    const status = r.won
      ? "WON"
      : r.landed
        ? r.onPad ? "CRASH  (too fast)" : "CRASH  (missed pad)"
        : "TIMEOUT";

    console.log(`  result      ${status}`);
    console.log(`  frames      ${r.frames}`);

    if (r.landed) {
      console.log(`  velocity    ${fmt(r.landingVelocity ?? 0)}  (max ${config.maxLandingVelocity})`);
      console.log(`  posX        ${fmt(r.posX, 1)}  (canvas centre ${SIM_WIDTH / 2})`);

      if (config.landingPad) {
        const cx   = config.landingPad.centerX ?? SIM_WIDTH / 2;
        const half = config.landingPad.width / 2;
        console.log(`  on pad      ${r.onPad}  (pad ${fmt(cx - half, 0)}\u2013${fmt(cx + half, 0)})`);
      }
      if (isFinite(config.fuel)) {
        const pct = fmt((r.fuelUsed / config.fuel) * 100, 0);
        console.log(`  fuel used   ${fmt(r.fuelUsed, 1)} / ${config.fuel}  (${pct}%)`);
      }
    }
  }
}

// ── Dynamic test registration ─────────────────────────────────────────────────

for (const index of indices) {
  const label = `L${index} — ${LEVELS[index].config.id}`;
  it(label, () => { printReport(index); });
}
