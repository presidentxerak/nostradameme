import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // server-only throws when imported outside a Server Component context.
      // In vitest we shim it to a no-op so lib/* code that imports it can be
      // exercised by tests directly.
      "server-only": path.resolve(__dirname, "./tests/_shims/server-only.ts"),
    },
  },
});
