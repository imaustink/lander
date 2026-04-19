/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  root: "app",
  test: {
    environment: "node",
    include: ["src/sim.ts"],
    reporters: ["verbose"],
  },
});
