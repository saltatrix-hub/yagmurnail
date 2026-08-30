import { copyFile, mkdir, rm } from 'node:fs/promises';

await mkdir('public/videos', { recursive: true });

const oldSiteAssets = [
  'public/index.html', 'public/site.html', 'public/app.js', 'public/styles.css',
  'public/cinematic-hero.js', 'public/1.png', 'public/2.png', 'public/3.png',
  'public/4.png', 'public/og.png', 'public/logo-mark.svg', 'public/favicon.ico',
  'public/favicon.png', 'public/favicon-32x32.png', 'public/favicon-16x16.png',
  'public/apple-touch-icon.png', 'public/videos/onyx-scroll.mp4', 'public/frames',
  'public/logo',
];

await Promise.all(oldSiteAssets.map((path) => rm(path, { recursive: true, force: true })));
await copyFile('videos/2.mp4', 'public/videos/2.mp4');
