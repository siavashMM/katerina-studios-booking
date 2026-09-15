import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

Object.assign(process.env, loadEnv("test", process.cwd(), ""));

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
          setupFiles: ["tests/integration/setup.ts"],
          testTimeout: 20000,
          hookTimeout: 30000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/features/booking/domain/**/*.ts",
        "src/features/booking/application/**/*.ts",
        "src/features/admin/application/**/*.ts",
        "src/features/reviews/application/**/*.ts",
        "src/features/reviews/domain/**/*.ts",
        "src/infrastructure/reviews/**/*.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/types.ts"],
      thresholds: {
        "src/features/booking/domain/**": {
          lines: 90,
          functions: 90,
          statements: 90,
          branches: 90,
        },
        "src/features/**/application/**": {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 80,
        },
        "src/features/reviews/domain/**": {
          lines: 90,
          functions: 90,
          statements: 90,
          branches: 90,
        },
        "src/infrastructure/reviews/**": {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 75,
        },
      },
    },
  },
});
