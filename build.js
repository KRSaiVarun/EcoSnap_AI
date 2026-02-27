import fs from "fs";
import { build as viteBuild } from "vite";

async function buildAll() {
  try {
    // Remove dist folder
    if (fs.existsSync("dist")) {
      fs.rmSync("dist", { recursive: true, force: true });
    }

    console.log("🔨 Building client...");
    await viteBuild();

    // Create a dummy dist/index.js so Vercel knows the app is ready
    fs.mkdirSync("dist", { recursive: true });
    fs.writeFileSync(
      "dist/index.js",
      `
// Production server entry point
// The actual server is run via tsx in the start script

import('../server/index.ts').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
`,
    );

    console.log("✅ Build complete!");
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

buildAll();
