import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig(({ command }) => {
  return {
    resolve: {
      alias: {
        "@": "/src",
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      viteReact(),
      command === "build"
        ? cloudflare({
            viteEnvironment: { name: "ssr" },
          })
        : undefined,
      VitePWA({
        // injectRegister: 'auto' adds the SW registration script to all HTML output pages.
        injectRegister: "auto",
        // injectManifest strategy: we own the service worker file (src/pwa/service-worker.ts).
        strategies: "injectManifest",
        srcDir: "src/pwa",
        filename: "service-worker.ts",
        // Reference the manifest we created in public/
        manifest: false, // disable auto-generation; we use public/manifest.webmanifest directly
        includeAssets: ["icons/*.png", "favicon.ico"],
        injectManifest: {
          // Only precache shell assets; exclude API paths and personal data.
          globPatterns: ["**/*.{js,css,html,woff2}"],
          globIgnores: ["**/api/**"],
        },
        devOptions: {
          // Avoid stale localhost service workers interfering with normal dev browsing.
          enabled: false,
          type: "module",
        },
      }),
    ].filter(Boolean),
  };
});
