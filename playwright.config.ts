import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const testDirectory = mkdtempSync(join(tmpdir(), "averis-browser-"));
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:4337",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"]],
  webServer: {
    command: "node server/index.mjs",
    url: "http://127.0.0.1:4337/api/health",
    reuseExistingServer: false,
    env: {
      NODE_ENV: "development",
      SERVE_STATIC: "true",
      PORT: "4337",
      HOST: "127.0.0.1",
      DATABASE_PATH: join(testDirectory, "test.sqlite"),
      SESSION_SECRET: "browser-test-secret-for-local-tests-only",
      SMTP_HOST: "",
      OIDC_ISSUER: "",
      LEGACY_API_ENABLED: "false",
      BOOTSTRAP_ORG_NAME: "Acme Indonesia",
      BOOTSTRAP_ORG_SLUG: "acme-indonesia",
      BOOTSTRAP_SUPER_ADMIN_EMAIL: "owner@acme.co.id",
      BOOTSTRAP_ADMIN_EMAIL: "admin@acme.co.id",
      BOOTSTRAP_MANAGER_EMAIL: "manager@acme.co.id",
      BOOTSTRAP_EMPLOYEE_EMAIL: "andini@acme.co.id",
      BOOTSTRAP_SUPER_ADMIN_PASSWORD: "Browser-Test-Password!2026",
      BOOTSTRAP_ADMIN_PASSWORD: "Browser-Test-Password!2026",
      BOOTSTRAP_MANAGER_PASSWORD: "Browser-Test-Password!2026",
      BOOTSTRAP_EMPLOYEE_PASSWORD: "Browser-Test-Password!2026",
    },
  },
});
