import handler from "vinext/server/fetch-handler";

// Sent with every page and API response. Scripts and styles stay 'unsafe-inline' because the framework
// writes its hydration data as inline scripts; everything else is limited to this origin.
const securityHeaders: Record<string, string> = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Two per-visitor limits on the API: one for everything, and a tighter one for starting or resetting a demo,
// because stored demos are capped. Loopback is exempt so the local test suite can run at full speed.
async function limited(request: Request, env: Cloudflare.Env): Promise<boolean> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/portal") || url.hostname === "127.0.0.1" || url.hostname === "localhost") return false;
  const key = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (request.method === "POST" && url.pathname.startsWith("/api/portal/demo") && !(await env.DEMO_LIMIT.limit({ key })).success) return true;
  return !(await env.API_LIMIT.limit({ key })).success;
}

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const response = await limited(request, env)
      ? Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } })
      : await handler.fetch(request, env, ctx);
    const secured = new Response(response.body, response);
    for (const [name, value] of Object.entries(securityHeaders)) secured.headers.set(name, value);
    return secured;
  },
};

export default worker;
