import { cp, mkdir } from 'node:fs/promises';

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
  cp('videos/onyx-scroll.mp4', 'public/videos/onyx-scroll.mp4'),
]);
