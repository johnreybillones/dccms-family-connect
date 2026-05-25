import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const srcFile = path.resolve("src/assets/seal-logo.png");
const outputDir = path.resolve("public/icons");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if sharp is installed, if not, install it dynamically
let sharp;
try {
  const sharpModule = await import("sharp");
  sharp = sharpModule.default;
} catch (e) {
  console.log("sharp is not installed. Installing sharp as a dev dependency...");
  execSync("npm install -D sharp", { stdio: "inherit" });
  const sharpModule = await import("sharp");
  sharp = sharpModule.default;
}

const sizes = [
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generateIcons() {
  console.log(`Generating PWA icons from ${srcFile}...`);
  for (const item of sizes) {
    const destPath = path.join(outputDir, item.name);
    await sharp(srcFile)
      .resize(item.size, item.size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
      })
      .toFile(destPath);
    console.log(`Generated: ${destPath} (${item.size}x${item.size})`);
  }
  console.log("All PWA icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
