import { defineConfig, devices } from "@playwright/test";

// E2E runs against a production build started with NO .env values, to prove the app works without secrets.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 5"],
    viewport: { width: 360, height: 740 },
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      MIRAS_DATA_DIR: "./data/e2e",
      // Short timeout so the slow-network test does not take 45 s.
      UPLOAD_TIMEOUT_MS: "3000",
      GEMINI_API_KEY: "",
      GEMINI_MODEL: "",
    },
  },
});
