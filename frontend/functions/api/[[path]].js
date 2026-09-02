/**
 * Same-origin /api/* reverse proxy for Cloudflare Pages.
 * Forwards to the Render Express API; optional API_ORIGIN override in Pages env.
 */
const DEFAULT_API_ORIGIN = "https://mew-and-you-api.onrender.com";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function proxyRequestHeaders(request, targetOrigin) {
  const headers = new Headers();
  const targetHost = new URL(targetOrigin).host;

  for (const [name, value] of request.headers.entries()) {
    const lower = name.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower) || lower === "host") {
      continue;
    }
    headers.append(name, value);
  }

  headers.set("Host", targetHost);
  headers.set("X-Forwarded-Host", request.headers.get("Host") ?? "");
  headers.set("X-Forwarded-Proto", new URL(request.url).protocol.replace(":", ""));

  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) {
    headers.set("X-Forwarded-For", clientIp);
  }

  return headers;
}

export async function onRequest(context) {
  const apiOrigin = (
    context.env.API_ORIGIN ?? DEFAULT_API_ORIGIN
  ).replace(/\/$/, "");

  const incoming = new URL(context.request.url);
  const target = new URL(incoming.pathname + incoming.search, apiOrigin);

  const method = context.request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  return fetch(
    new Request(target.toString(), {
      method,
      headers: proxyRequestHeaders(context.request, apiOrigin),
      body: hasBody ? context.request.body : undefined,
      redirect: "manual",
    }),
  );
}
