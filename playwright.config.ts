import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

const environment = loadEnv("test", process.cwd(), "");
const database = process.env.TEST_DATABASE_URL ?? environment.TEST_DATABASE_URL;
if (!database || !new URL(database).pathname.endsWith("_test"))
  throw new Error("Browser tests require TEST_DATABASE_URL ending in _test.");
Object.assign(process.env, environment, {
  DATABASE_URL: database,
  TEST_DATABASE_URL: database,
  DEMO_MODE: "true",
  APP_URL: "http://localhost:3100",
  PORT: "3100",
  AUTH0_DOMAIN: "https://identity.example.test",
  AUTH0_CLIENT_ID: "test-client",
  AUTH0_CLIENT_SECRET: "test-secret",
  AUTH0_SECRET: "a".repeat(64),
  AUTH0_TEST_INSECURE: "false",
});
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm start",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: false,
    timeout: 60000,
    env: Object.fromEntries(
      Object.entries(process.env).filter(
        (item): item is [string, string] => typeof item[1] === "string",
      ),
    ),
  },
});
