// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
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
    ],
  },
});
