/**
 * Same-origin /api/* reverse proxy for Cloudflare Pages.
 *
 * Set API_ORIGIN in the Pages dashboard (e.g. https://your-api.onrender.com,
 * no trailing slash). Requests return 503 until it is configured — do not
 * hardcode a Render hostname here (service names differ per environment).
 */

interface ApiProxyEnv {
  API_ORIGIN?: string;
}

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

function proxyRequestHeaders(request: Request, targetOrigin: string): Headers {
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
  headers.set(
    "X-Forwarded-Proto",
    new URL(request.url).protocol.replace(":", ""),
  );

  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) {
    headers.set("X-Forwarded-For", clientIp);
  }

  return headers;
}

export async function onRequest(
  context: EventContext<ApiProxyEnv, string, unknown>,
): Promise<Response> {
  const apiOrigin = context.env.API_ORIGIN?.trim().replace(/\/$/, "");
  if (!apiOrigin) {
    return new Response(
      JSON.stringify({
        error: {
          code: "api_proxy_not_configured",
          message:
            "Set API_ORIGIN in Cloudflare Pages environment variables.",
        },
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

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
