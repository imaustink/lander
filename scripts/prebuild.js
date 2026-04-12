/**
 * prebuild.js — run before every `vite build`
 *
 * 1. Deletes all compiled JS chunks from assets/ so stale hashed files
 *    don't accumulate and get picked up as rollup inputs on the next build.
 *
 * 2. Rewrites index.html and frames/game.html back to their "source" form
 *    (bare <script type="module" src="...ts"> tags).  Vite overwrites these
 *    files with hashed asset references on each build; without this reset
 *    every subsequent build chains off the previous compiled chunks instead
 *    of recompiling from TypeScript source.
 */

import { readFileSync, writeFileSync, readdirSync, rmSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(fileURLToPath(import.meta.url), "../..");

// ── 1. Remove stale JS chunks ─────────────────────────────────────────────

const assetsDir = join(root, "assets");
let removed = 0;
for (const file of readdirSync(assetsDir)) {
  if (file.endsWith(".js")) {
    rmSync(join(assetsDir, file));
    removed++;
  }
}
if (removed) console.log(`prebuild: removed ${removed} stale asset(s) from assets/`);

// ── 2. Reset index.html ──────────────────────────────────────────────────

const indexPath = join(root, "index.html");
const indexHtml = readFileSync(indexPath, "utf8");

// Replace everything from <script src="/vs/loader.js"> through </head>
// with the source entry point form.
const indexReset = indexHtml.replace(
  /(<script src="\/vs\/loader\.js"><\/script>)[\s\S]*?(<\/head>)/,
  '$1\n    <script src="./src/editor.ts" type="module"></script>\n  $2',
);

if (indexReset !== indexHtml) {
  writeFileSync(indexPath, indexReset, "utf8");
  console.log("prebuild: reset index.html to source entry point");
} else {
  console.log("prebuild: index.html already in source form");
}

// ── 3. Reset frames/game.html ─────────────────────────────────────────────

const gamePath = join(root, "frames", "game.html");
const gameHtml = readFileSync(gamePath, "utf8");

// Replace everything between </style> and <body> with the source entry point.
const gameReset = gameHtml.replace(
  /(<\/style>)[\s\S]*?(<body>)/,
  '$1\n  </head>\n  $2\n    <canvas id="game"></canvas>\n    <script src="../src/game.ts" type="module"></script>',
);

// Also strip any stray content between <body> and </body> that the build injected.
const gameResetFinal = gameReset.replace(
  /(<body>)[\s\S]*?(<\/body>)/,
  (_, open, close) => {
    // Keep existing content if it already looks like source form
    const inner = gameReset.slice(
      gameReset.indexOf(open) + open.length,
      gameReset.lastIndexOf(close),
    );
    if (inner.includes('src="../src/game.ts"')) return open + inner + close;
    return `${open}\n    <canvas id="game"></canvas>\n    <script src="../src/game.ts" type="module"></script>\n  ${close}`;
  },
);

if (gameResetFinal !== gameHtml) {
  writeFileSync(gamePath, gameResetFinal, "utf8");
  console.log("prebuild: reset frames/game.html to source entry point");
} else {
  console.log("prebuild: frames/game.html already in source form");
}
