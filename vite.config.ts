/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  optimizeDeps: {
    exclude: ["monaco-editor"],
  },
  build: {
    outDir: ".",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        game: resolve(__dirname, "frames/game.html"),
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
