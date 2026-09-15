const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) {
  throw new Error(
    "Integration tests require TEST_DATABASE_URL with a database name ending in _test.",
  );
}
process.env.DATABASE_URL = url;
process.env.DEMO_MODE = "true";
