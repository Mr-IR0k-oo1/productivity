import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "components/**/*.test.ts", "lib/**/*.test.ts", "hooks/**/*.test.ts"],
    exclude: ["node_modules", ".next", "pulseforge-desktop", "src-tauri"],
  },
});
