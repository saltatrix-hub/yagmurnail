const VIDEO_SELECTOR = '[data-cinematic-video]';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export class OnyxVideoHero {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError('OnyxVideoHero requires a root element.');

    this.root = root;
    this.video = root.querySelector(VIDEO_SELECTOR);
    this.header = document.querySelector('.site-header');
    this.motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    this.abortController = new AbortController();
    this.scrollRaf = 0;

    if (!(this.video instanceof HTMLVideoElement)) return;

    this.video.muted = true;
    this.video.defaultMuted = true;
    this.video.loop = true;
    this.video.playsInline = true;

    const { signal } = this.abortController;
    this.video.addEventListener('canplay', () => this.play(), { signal });
    this.video.addEventListener('playing', () => this.root.classList.add('is-playing'), { signal });
    this.video.addEventListener('error', () => this.root.classList.add('is-video-unavailable'), { signal });
    this.motionQuery.addEventListener('change', () => this.syncMotionPreference(), { signal });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.syncMotionPreference();
    }, { signal });
    window.addEventListener('scroll', () => this.scheduleHeaderUpdate(), { passive: true, signal });
    window.addEventListener('resize', () => this.scheduleHeaderUpdate(), { passive: true, signal });

    this.syncMotionPreference();
    this.updateHeader();
  }

  play() {
    if (!this.video || document.hidden || this.motionQuery.matches) return;
    const playback = this.video.play();
    if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  }

  syncMotionPreference() {
    if (!this.video) return;
    if (this.motionQuery.matches) {
      this.video.pause();
      this.root.classList.add('is-reduced-motion');
      return;
    }
    this.root.classList.remove('is-reduced-motion');
    this.play();
  }

  scheduleHeaderUpdate() {
    if (this.scrollRaf) return;
    this.scrollRaf = window.requestAnimationFrame(() => {
      this.scrollRaf = 0;
      this.updateHeader();
    });
  }

  updateHeader() {
    if (!this.header) return;
    const boundary = Math.max(0, this.root.offsetTop + this.root.offsetHeight - this.header.offsetHeight);
    this.header.classList.toggle('past-cinematic', window.scrollY >= boundary);
  }

  destroy() {
    window.cancelAnimationFrame(this.scrollRaf);
    this.abortController.abort();
    this.header?.classList.remove('past-cinematic');
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
