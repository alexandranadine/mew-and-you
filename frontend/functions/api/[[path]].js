/**
 * Same-origin /api/* proxy for Cloudflare Pages.
 *
 * Set API_ORIGIN in the Pages dashboard (e.g. https://your-api.example.com)
 * when the Express API is deployed. Until then, requests return 503.
 */
export async function onRequest(context) {
  const apiOrigin = context.env.API_ORIGIN?.replace(/\/$/, "");
  if (!apiOrigin) {
    return new Response(
      JSON.stringify({
        error: "API proxy not configured",
        message: "Set API_ORIGIN in Cloudflare Pages environment variables.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const incoming = new URL(context.request.url);
  const target = new URL(incoming.pathname + incoming.search, apiOrigin);

  return fetch(
    new Request(target.toString(), {
      method: context.request.method,
      headers: context.request.headers,
      body: context.request.body,
      redirect: "manual",
    }),
  );
}
