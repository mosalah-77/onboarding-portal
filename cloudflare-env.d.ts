declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    DEMO_ADMIN_TOKEN?: string;
    API_LIMIT: RateLimit;
    DEMO_LIMIT: RateLimit;
  }
}
