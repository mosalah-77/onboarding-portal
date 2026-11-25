import vinext from "vinext";
import { defineConfig } from "vite";
import { configureToolEnvironment } from "./scripts/tool-environment.mjs";

export default defineConfig(async () => {
  configureToolEnvironment(process.cwd());

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        // The Worker and its D1 database on Cloudflare. A database ID is not a secret.
        config: {
          name: "samepage",
          main: "./worker/index.ts",
          compatibility_flags: ["nodejs_compat"],
          // Hourly removal of expired demos, handled by `scheduled` in worker/index.ts.
          triggers: { crons: ["0 * * * *"] },
          // Per-visitor request limits, enforced in worker/index.ts.
          ratelimits: [
            { name: "API_LIMIT", namespace_id: "1001", simple: { limit: 240, period: 60 } },
            { name: "DEMO_LIMIT", namespace_id: "1002", simple: { limit: 6, period: 60 } },
          ],
          d1_databases: [
            {
              binding: "DB",
              database_name: "samepage",
              database_id: "9cca17c0-65a3-4a56-adf4-582893a32993",
            },
          ],
        },
      }),
    ],
  };
});
