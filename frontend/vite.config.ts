import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

export function siteOrigin(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return (env.VITE_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
}

/** Rewrite crawler-fallback absolute URLs using the build-time site origin. */
export function transformSeoIndexHtml(html: string, origin: string): string {
  const withAbsoluteImages = html.replaceAll(
    'content="/images/mew-and-you-cat-peek.png"',
    `content="${origin}/images/mew-and-you-cat-peek.png"`,
  );
  const withOgUrl = withAbsoluteImages.replace(
    '<meta property="og:url" content="/" />',
    `<meta property="og:url" content="${origin}/" />`,
  );
  return withOgUrl.replace(
    "</head>",
    `    <link rel="canonical" href="${origin}/" />\n  </head>`,
  );
}

function robotsTxt(origin: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");
}

function sitemapXml(origin: string): string {
  // Static, indexable routes only. Search and cat detail URLs depend on query
  // params or live inventory and are not enumerable without a list-all API.
  const urls = ["/", "/about"];
  const entries = urls
    .map(
      (path) => `  <url>
    <loc>${origin}${path}</loc>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function seoStaticFiles(): Plugin {
  const origin = siteOrigin();
  const robots = robotsTxt(origin);
  const sitemap = sitemapXml(origin);

  function serve(
    reqUrl: string | undefined,
    res: {
      setHeader: (name: string, value: string) => void;
      end: (body: string) => void;
    },
    next: () => void,
  ) {
    const path = reqUrl?.split("?")[0];
    if (path === "/robots.txt") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(robots);
      return;
    }
    if (path === "/sitemap.xml") {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.end(sitemap);
      return;
    }
    next();
  }

  return {
    name: "seo-static-files",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        serve(req.url, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        serve(req.url, res, next);
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: robots,
      });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: sitemap,
      });
    },
    transformIndexHtml(html) {
      return transformSeoIndexHtml(html, origin);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), seoStaticFiles()],
  server: {
    // Forward API calls to the local Express backend during development so
    // the frontend can just fetch("/api/...") without worrying about CORS
    // or hardcoding a base URL.
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
