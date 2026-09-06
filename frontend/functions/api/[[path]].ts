/**
 * Same-origin /api/* reverse proxy for Cloudflare Pages.
 *
 * Forwards to the Render Express API. Set API_ORIGIN in the Pages dashboard
 * (Production / Preview runtime env). Do not commit the real hostname.
 */

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

interface PagesEnv {
  API_ORIGIN?: string;
}

function resolveApiOrigin(env: PagesEnv | undefined): string | null {
  const raw = env?.API_ORIGIN?.trim();
  if (!raw) return null;
  const origin = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(origin)) return null;
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

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

export async function onRequest(context: {
  request: Request;
  env: PagesEnv;
}): Promise<Response> {
  const apiOrigin = resolveApiOrigin(context.env);
  if (!apiOrigin) {
    return jsonError(
      503,
      "api_proxy_not_configured",
      "The API proxy is not configured. Set API_ORIGIN in the Cloudflare Pages environment.",
    );
  }

  const incoming = new URL(context.request.url);
  const target = new URL(incoming.pathname + incoming.search, apiOrigin);

  const method = context.request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    return await fetch(
      new Request(target.toString(), {
        method,
        headers: proxyRequestHeaders(context.request, apiOrigin),
        body: hasBody ? context.request.body : undefined,
        redirect: "manual",
      }),
    );
  } catch {
    return jsonError(
      502,
      "api_proxy_upstream_unavailable",
      "The API is temporarily unavailable. Please try again shortly.",
    );
  }
}
