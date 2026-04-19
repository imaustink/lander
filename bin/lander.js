#!/usr/bin/env node
/**
 * lander — local dev server for @k5s/lander
 *
 * Serves the built game from the package's own directory and opens it in
 * the default browser. Works after `npm install -g @k5s/lander`.
 */

import { createServer } from "http";
import { createReadStream, existsSync } from "fs";
import { resolve, extname, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
};

const server = createServer((req, res) => {
  // Strip query strings and sanitize path to prevent directory traversal
  let urlPath = req.url.split("?")[0];
  // Normalize and ensure path stays within root
  const normalized = resolve(root, "." + decodeURIComponent(urlPath));
  if (!normalized.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Default to index.html for /
  const filePath = urlPath === "/" ? resolve(root, "index.html") : normalized;

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Moon Lander running at ${url}\n`);
  openBrowser(url);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Set PORT=<number> to use a different port.`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? `open "${url}"` :
    process.platform === "win32"  ? `start "" "${url}"` :
                                    `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.warn("Could not open browser automatically. Visit:", url);
  });
}
