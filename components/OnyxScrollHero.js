const VIDEO_SELECTOR = '[data-cinematic-video]';

export class OnyxVideoHero {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError('OnyxVideoHero requires a root element.');

    this.root = root;
    this.video = root.querySelector(VIDEO_SELECTOR);
    this.abortController = new AbortController();

    if (!(this.video instanceof HTMLVideoElement)) return;

    this.video.muted = true;
    this.video.defaultMuted = true;
    this.video.loop = true;
    this.video.playsInline = true;

    const { signal } = this.abortController;
    this.video.addEventListener('canplay', () => this.play(), { signal });
    this.video.addEventListener('playing', () => this.root.classList.add('is-playing'), { signal });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.play();
    }, { signal });

    this.play();
  }

  play() {
    if (!this.video || document.hidden) return;
    const playback = this.video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  }

  destroy() {
    this.abortController.abort();
  }
}

export function mountOnyxVideoHero(selector = '#cinematicHero') {
  const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
  return root ? new OnyxVideoHero(root) : null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mountOnyxVideoHero(), { once: true });
} else {
  mountOnyxVideoHero();
}
