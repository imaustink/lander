/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "app",
  optimizeDeps: {
    exclude: ["monaco-editor"],
  },
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "app/index.html"),
        game: resolve(__dirname, "app/frames/game.html"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
