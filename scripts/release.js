/**
 * release.js — version bump + npm publish
 *
 * Usage:
 *   node scripts/release.js patch   # 1.0.0 → 1.0.1
 *   node scripts/release.js minor   # 1.0.0 → 1.1.0
 *   node scripts/release.js major   # 1.0.0 → 2.0.0
 *
 * Or via npm scripts:
 *   npm run release:patch
 *   npm run release:minor
 *   npm run release:major
 *
 * Steps performed:
 *   1. Validates working tree is clean (no uncommitted changes)
 *   2. Runs tests (npm test)
 *   3. Bumps version via `npm version <type>` (creates a git tag)
 *   4. Publishes to npm (also runs `prepublishOnly` → build)
 *   5. Pushes the commit + tag to origin
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VALID_BUMP_TYPES = ["patch", "minor", "major"];

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  return pkg.version;
}

function assertCleanWorkingTree() {
  try {
    const status = execSync("git status --porcelain", { cwd: root }).toString().trim();
    if (status) {
      console.error("Error: working tree has uncommitted changes. Commit or stash them first.\n");
      console.error(status);
      process.exit(1);
    }
  } catch {
    console.warn("Warning: could not verify git status. Proceeding anyway.");
  }
}

function assertOnMainBranch() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: root })
      .toString()
      .trim();
    if (branch !== "main" && branch !== "master") {
      console.warn(`Warning: releasing from branch "${branch}" (expected main/master).`);
    }
  } catch {
    // not a git repo or git not available — skip
  }
}

const bumpType = process.argv[2];

if (!VALID_BUMP_TYPES.includes(bumpType)) {
  console.error(`Usage: node scripts/release.js <patch|minor|major>`);
  process.exit(1);
}

console.log(`\n=== Moon Lander release: ${bumpType} bump ===`);
console.log(`Current version: ${getCurrentVersion()}`);

assertCleanWorkingTree();
assertOnMainBranch();

// 1. Run tests
run("npm test");

// 2. Bump version + create git tag
run(`npm version ${bumpType} --message "chore: release v%s"`);

const newVersion = getCurrentVersion();
console.log(`\nBumped to: ${newVersion}`);

// 3. Push commit + tag (CI publishes to npm on tag push)
try {
  run("git push --follow-tags");
} catch {
  console.warn("\nWarning: could not push to remote. Push manually with: git push --follow-tags");
}

console.log(`\n=== Released @k5s/lander@${newVersion} ===`);
