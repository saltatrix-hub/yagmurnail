import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const ONYX_SCROLL_TIMINGS = Object.freeze({
  brandIn: 0.10,
  brandOut: 0.22,
  detailIn: 0.30,
  detailOut: 0.46,
  signatureIn: 0.58,
  signatureOut: 0.75,
  finalIn: 0.88,
  ctaIn: 0.92,
  handoffIn: 0.94,
});

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MOBILE_QUERY = '(max-width: 720px)';
const PRELOAD_CONCURRENCY = 8;

export class OnyxScrollHero {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError('OnyxScrollHero requires a root element.');

    this.root = root;
    this.canvas = root.querySelector('[data-cinematic-canvas]');
    this.loading = root.querySelector('[data-cinematic-loading]');
    this.header = document.querySelector('.site-header');
    this.motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    this.mobileQuery = window.matchMedia(MOBILE_QUERY);
    this.abortController = new AbortController();
    this.context = null;
    this.timeline = null;
    this.frames = [];
    this.framePromises = [];
    this.requestedFrame = 0;
    this.renderRaf = 0;
    this.isDestroyed = false;
    this.loadTimeout = 0;
    this.frameCount = Number.parseInt(
      (this.mobileQuery.matches ? this.canvas?.dataset.mobileFrameCount : this.canvas?.dataset.frameCount) || '0',
      10,
    );
    this.framePath = (this.mobileQuery.matches ? this.canvas?.dataset.mobileFramePath : this.canvas?.dataset.framePath) || '';
    this.resizeRefresh = gsap.delayedCall(0.2, () => {
      this.resizeCanvas();
      ScrollTrigger.refresh();
    }).pause();

    if (!(this.canvas instanceof HTMLCanvasElement) || !this.canvas.getContext || this.frameCount < 2 || !this.framePath) {
      this.activateFallback('Animasyon hazırlanamadı');
      return;
    }

    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!this.ctx) {
      this.activateFallback('Animasyon hazırlanamadı');
      return;
    }

    this.frames = new Array(this.frameCount);
    this.framePromises = new Array(this.frameCount);
    this.init();
  }

  async init() {
    const { signal } = this.abortController;
    this.motionQuery.addEventListener('change', () => this.rebuild(), { signal });
    window.addEventListener('resize', () => this.resizeRefresh.restart(true), { passive: true, signal });
    window.addEventListener('orientationchange', () => this.resizeRefresh.restart(true), { passive: true, signal });
    window.addEventListener('pagehide', () => this.destroy(), { once: true, signal });

    this.loadTimeout = window.setTimeout(() => {
      if (!this.frames[0]) this.activateFallback('Animasyon yüklenemedi');
    }, 12000);

    try {
      await this.loadFrame(0);
      if (this.isDestroyed) return;
      window.clearTimeout(this.loadTimeout);
      this.resizeCanvas();
      this.drawFrame(this.frames[0]);
      this.revealCanvas();
      this.rebuild();
      this.preloadFrames();
    } catch {
      this.activateFallback('Animasyon yüklenemedi');
    }
  }

  frameUrl(index) {
    const frameNumber = String(index + 1).padStart(4, '0');
    return this.framePath.replace('{frame}', frameNumber);
  }

  loadFrame(index) {
    const safeIndex = gsap.utils.clamp(0, this.frameCount - 1, Math.round(index));
    if (this.frames[safeIndex]) return Promise.resolve(this.frames[safeIndex]);
    if (this.framePromises[safeIndex]) return this.framePromises[safeIndex];

    this.framePromises[safeIndex] = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        this.frames[safeIndex] = image;
        resolve(image);
      };
      image.onerror = reject;
      image.src = this.frameUrl(safeIndex);
    });

    return this.framePromises[safeIndex];
  }

  async preloadFrames() {
    let nextFrame = 1;
    const worker = async () => {
      while (!this.isDestroyed && nextFrame < this.frameCount) {
        const index = nextFrame++;
        try { await this.loadFrame(index); } catch {}
      }
    };
    await Promise.all(Array.from({ length: PRELOAD_CONCURRENCY }, worker));
  }

  rebuild() {
    if (!this.frames[0] || this.isDestroyed) return;
    this.context?.revert();
    this.context = null;
    this.timeline = null;
    this.header?.classList.remove('past-cinematic');
    gsap.set(this.root.querySelectorAll('[data-cinematic-copy]'), { clearProps: 'all' });

    if (this.motionQuery.matches) {
      this.applyReducedMotion();
      return;
    }

    this.root.classList.remove('is-reduced', 'is-fallback');
    this.buildTimeline();
  }

  buildTimeline() {
    const brand = this.root.querySelector('[data-cinematic-brand]');
    const detail = this.root.querySelector('[data-cinematic-detail]');
    const signature = this.root.querySelector('[data-cinematic-signature]');
    const final = this.root.querySelector('[data-cinematic-final]');
    const cta = this.root.querySelector('[data-cinematic-cta]');
    const hint = this.root.querySelector('[data-cinematic-hint]');
    const handoff = this.root.querySelector('[data-cinematic-handoff]');
    const playhead = { frame: 0 };
    const timings = ONYX_SCROLL_TIMINGS;

    this.context = gsap.context(() => {
      gsap.set([brand, detail, signature, final, cta], { autoAlpha: 0 });
      gsap.set([brand, detail, signature], { y: 30, scale: 0.98 });
      gsap.set(final, { y: 22 });
      gsap.set(cta, { y: 14 });
      gsap.set(handoff, { autoAlpha: 0 });

      this.timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: this.root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.45,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            this.root.style.setProperty('--cinematic-progress', self.progress.toFixed(4));
            this.header?.classList.toggle('past-cinematic', self.progress >= 0.995);
          },
          onLeave: () => this.header?.classList.add('past-cinematic'),
          onEnterBack: () => this.header?.classList.remove('past-cinematic'),
        },
      });

      this.timeline
        .to(playhead, {
          frame: this.frameCount - 1,
          duration: 1,
          ease: 'none',
          onUpdate: () => this.renderFrame(playhead.frame),
        }, 0)
        .to(hint, { autoAlpha: 0, duration: 0.06, ease: 'none' }, 0.04)
        .fromTo(brand,
          { autoAlpha: 0, y: 28, scale: 0.98 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.06, immediateRender: false },
          timings.brandIn)
        .to(brand, { autoAlpha: 0, y: -18, scale: 0.99, duration: 0.06 }, timings.brandOut)
        .fromTo(detail,
          { autoAlpha: 0, y: 32, scale: 0.98 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.07, immediateRender: false },
          timings.detailIn)
        .to(detail, { autoAlpha: 0, y: -20, scale: 0.99, duration: 0.06 }, timings.detailOut)
        .fromTo(signature,
          { autoAlpha: 0, y: 32, scale: 0.98 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.07, immediateRender: false },
          timings.signatureIn)
        .to(signature, { autoAlpha: 0, y: -20, scale: 0.99, duration: 0.06 }, timings.signatureOut)
        .fromTo(final,
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 0.06, immediateRender: false },
          timings.finalIn)
        .fromTo(cta,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.05, immediateRender: false },
          timings.ctaIn)
        .to(handoff, { autoAlpha: 0.38, duration: 0.06, ease: 'none' }, timings.handoffIn);

      ScrollTrigger.refresh();
    }, this.root);
  }

  renderFrame(frame) {
    this.requestedFrame = gsap.utils.clamp(0, this.frameCount - 1, Math.round(frame));
    this.loadFrame(this.requestedFrame).then(() => this.scheduleDraw()).catch(() => this.scheduleDraw());
    this.scheduleDraw();
  }

  scheduleDraw() {
    if (this.renderRaf || this.isDestroyed) return;
    this.renderRaf = window.requestAnimationFrame(() => {
      this.renderRaf = 0;
      const image = this.frames[this.requestedFrame] || this.nearestLoadedFrame(this.requestedFrame);
      if (image) this.drawFrame(image);
    });
  }

  nearestLoadedFrame(index) {
    for (let distance = 1; distance < this.frameCount; distance += 1) {
      if (this.frames[index - distance]) return this.frames[index - distance];
      if (this.frames[index + distance]) return this.frames[index + distance];
    }
    return this.frames[0];
  }

  resizeCanvas() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const image = this.frames[this.requestedFrame] || this.nearestLoadedFrame(this.requestedFrame);
    if (image) this.drawFrame(image);
  }

  drawFrame(image) {
    if (!image || !this.ctx || !this.canvas.width || !this.canvas.height) return;
    const scale = Math.max(this.canvas.width / image.naturalWidth, this.canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = (this.canvas.width - width) / 2;
    const y = (this.canvas.height - height) / 2;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(image, x, y, width, height);
  }

  applyReducedMotion() {
    this.root.classList.add('is-reduced');
    this.requestedFrame = 0;
    this.drawFrame(this.frames[0]);
    this.revealCanvas();
  }

  revealCanvas() {
    this.canvas.classList.add('is-ready');
    this.loading?.classList.add('is-hidden');
  }

  activateFallback(message) {
    if (this.isDestroyed) return;
    window.clearTimeout(this.loadTimeout);
    this.context?.revert();
    this.context = null;
    this.timeline = null;
    this.root.classList.add('is-fallback');
    if (this.loading) {
      const status = this.loading.querySelector('[data-loading-status]');
      if (status) status.textContent = message;
      this.loading.classList.add('is-hidden');
    }
    this.header?.classList.add('past-cinematic');
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    window.clearTimeout(this.loadTimeout);
    window.cancelAnimationFrame(this.renderRaf);
    this.abortController.abort();
    this.resizeRefresh.kill();
    this.context?.revert();
    this.header?.classList.remove('past-cinematic');
    this.root.style.removeProperty('--cinematic-progress');
  }
}

export function mountOnyxScrollHero(selector = '#cinematicHero') {
  const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
  return root ? new OnyxScrollHero(root) : null;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mountOnyxScrollHero(), { once: true });
} else {
  mountOnyxScrollHero();
}
