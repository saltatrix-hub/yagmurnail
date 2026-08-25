import { cp, mkdir } from 'node:fs/promises';
import { build } from 'vite';

await mkdir('public/videos', { recursive: true });
await Promise.all([
  cp('index.html', 'public/site.html'),
  cp('app.js', 'public/app.js'),
  cp('styles.css', 'public/styles.css'),
  cp('1.png', 'public/1.png'),
  cp('2.png', 'public/2.png'),
  cp('3.png', 'public/3.png'),
  cp('4.png', 'public/4.png'),
  cp('og.png', 'public/og.png'),
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
