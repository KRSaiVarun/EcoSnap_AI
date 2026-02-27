const { build } = require('esbuild');
const { build: viteBuild } = require('vite');
const fs = require('fs');
const path = require('path');

async function buildAll() {
  try {
    // Remove dist folder
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }

    console.log('🔨 Building client...');
    await viteBuild({
      root: path.resolve(__dirname, 'client'),
      outDir: path.resolve(__dirname, 'dist/public'),
      emptyOutDir: true,
    });

    console.log('🔨 Building server...');
    await build({
      entryPoints: ['server/index.ts'],
      platform: 'node',
      bundle: true,
      format: 'cjs',
      outfile: 'dist/index.cjs',
      minify: true,
      logLevel: 'info',
    });

    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildAll();
