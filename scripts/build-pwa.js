import esbuild from "esbuild";
import { injectManifest } from "workbox-build";
import path from "path";
import fs from "fs";

async function buildPWA() {
  const swSrc = path.resolve("src/pwa/service-worker.ts");
  const tempSwDest = path.resolve("dist/client/service-worker.temp.js");
  const swDest = path.resolve("dist/client/service-worker.js");
  const globDirectory = path.resolve("dist/client");

  console.log("1. Bundling service worker with esbuild...");

  // Compile TypeScript service worker to a temporary JS file
  await esbuild.build({
    entryPoints: [swSrc],
    bundle: true,
    outfile: tempSwDest,
    format: "iife",
    platform: "browser",
    minify: true,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });

  console.log("2. Injecting precache manifest with workbox-build...");

  // Inject __WB_MANIFEST into the bundled service worker
  const result = await injectManifest({
    swSrc: tempSwDest,
    swDest: swDest,
    globDirectory: globDirectory,
    globPatterns: ["**/*.{js,css,html,woff2,png,ico,webmanifest}"],
    globIgnores: ["**/api/**", "assets/seal-logo-*.png"], // exclude original high-res logo from precache
  });

  // Clean up temporary file
  if (fs.existsSync(tempSwDest)) {
    fs.unlinkSync(tempSwDest);
  }

  // Fix TanStack Start preview server lookup mismatch for Cloudflare environment
  const indexJs = path.resolve("dist/server/index.js");
  const serverJs = path.resolve("dist/server/server.js");
  if (fs.existsSync(indexJs)) {
    fs.copyFileSync(indexJs, serverJs);
    console.log("3. Copied dist/server/index.js to dist/server/server.js to support vite preview.");
  }

  console.log(`PWA Service Worker generated successfully: ${swDest}`);
  console.log(`Precached ${result.count} assets (${(result.size / 1024 / 1024).toFixed(2)} MB)`);
}

buildPWA().catch((err) => {
  console.error("Failed to build PWA service worker:", err);
  process.exit(1);
});
