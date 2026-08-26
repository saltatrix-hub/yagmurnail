import { copyFile, mkdir } from 'node:fs/promises';
import { build } from 'vite';

await mkdir('public/videos', { recursive: true });
await mkdir('public/logo', { recursive: true });
await Promise.all([
  copyFile('index.html', 'public/index.html'),
  copyFile('index.html', 'public/site.html'),
  copyFile('app.js', 'public/app.js'),
  copyFile('styles.css', 'public/styles.css'),
  copyFile('1.png', 'public/1.png'),
  copyFile('2.png', 'public/2.png'),
  copyFile('3.png', 'public/3.png'),
  copyFile('4.png', 'public/4.png'),
  copyFile('og.png', 'public/og.png'),
  copyFile('logo-mark.svg', 'public/logo-mark.svg'),
  copyFile('logo/logo_w.png', 'public/logo/logo_w.png'),
  copyFile('logo/logo_b.png', 'public/logo/logo_b.png'),
  copyFile('favicon.ico', 'public/favicon.ico'),
  copyFile('Favicon.png', 'public/favicon.png'),
  copyFile('favicon-32x32.png', 'public/favicon-32x32.png'),
  copyFile('favicon-16x16.png', 'public/favicon-16x16.png'),
  copyFile('apple-touch-icon.png', 'public/apple-touch-icon.png'),
  copyFile('videos/2.mp4', 'public/videos/2.mp4'),
]);

await build({
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  build: {
    emptyOutDir: false,
    outDir: 'public',
    minify: 'esbuild',
    sourcemap: false,
    lib: {
      entry: 'components/OnyxScrollHero.js',
      name: 'OnyxCinematic',
      formats: ['iife'],
      fileName: () => 'cinematic-hero.js',
    },
  },
});
