import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Normalized positions make the editorial timing easy to tune without
// coupling copy animation to the source video's exact duration.
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

const MOBILE_QUERY = '(max-width: 720px) and (orientation: portrait)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const VIDEO_STEP_SECONDS = 3;

export class OnyxScrollHero {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new TypeError('OnyxScrollHero requires a root element.');

    this.root = root;
    this.video = root.querySelector('[data-cinematic-video]');
    this.loading = root.querySelector('[data-cinematic-loading]');
    this.header = document.querySelector('.site-header');
    this.motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    this.mobileQuery = window.matchMedia(MOBILE_QUERY);
    this.abortController = new AbortController();
    this.context = null;
    this.timeline = null;
    this.videoTween = null;
    this.scrollTween = null;
    this.stepIndex = 0;
    this.wheelLocked = false;
    this.metadataReady = false;
    this.isDestroyed = false;
    this.loadTimeout = 0;
    this.resizeRefresh = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
    this.wheelUnlock = gsap.delayedCall(1.35, () => { this.wheelLocked = false; }).pause();

    if (!(this.video instanceof HTMLVideoElement)) return;
    this.init();
  }

  async init() {
    const { signal } = this.abortController;

    this.video.muted = true;
    this.video.playsInline = true;
    this.video.pause();

    this.video.addEventListener('loadedmetadata', () => this.onMetadata(), { signal });
    this.video.addEventListener('loadeddata', () => this.revealVideo(), { signal });
    this.video.addEventListener('canplay', () => this.revealVideo(), { signal });
    this.video.addEventListener('error', () => this.activateFallback('Video yüklenemedi'), { signal });
    this.motionQuery.addEventListener('change', () => this.rebuild(), { signal });
    window.addEventListener('resize', () => this.resizeRefresh.restart(true), { passive: true, signal });
    window.addEventListener('orientationchange', () => this.resizeRefresh.restart(true), { passive: true, signal });
    window.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false, signal });
    window.addEventListener('pagehide', () => this.destroy(), { once: true, signal });
    document.addEventListener('pointerdown', () => this.primeVideo(), { once: true, passive: true, signal });

    this.loadTimeout = window.setTimeout(() => {
      if (!this.metadataReady) this.activateFallback('Video hazırlanamadı');
    }, 12000);

    await this.selectVideoSource();
    if (this.isDestroyed) return;
    if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) this.onMetadata();
    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) this.revealVideo();
  }

  async selectVideoSource() {
    const desktopSource = this.video.dataset.desktopSrc;
    const mobileSource = this.video.dataset.mobileSrc;
    let selectedSource = desktopSource;

    this.root.classList.toggle('is-mobile', this.mobileQuery.matches);
    // Scroll-scrubbing needs the media bytes ready; metadata-only loading can
    // leave currentTime changes stalled on mobile/CDN combinations.
    this.video.preload = 'auto';

    if (this.mobileQuery.matches && mobileSource) {
      try {
        const response = await fetch(mobileSource, {
          method: 'HEAD',
          cache: 'force-cache',
          signal: this.abortController.signal,
        });
        if (response.ok) selectedSource = mobileSource;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    if (!selectedSource) return this.activateFallback('Video kaynağı bulunamadı');
    const absoluteSource = new URL(selectedSource, window.location.href).href;
    if (this.video.currentSrc !== absoluteSource) {
      this.video.src = selectedSource;
      this.video.load();
    }
  }

  onMetadata() {
    if (this.metadataReady || this.isDestroyed) return;
    if (!Number.isFinite(this.video.duration) || this.video.duration <= 0) {
      this.activateFallback('Video süresi okunamadı');
      return;
    }

    this.metadataReady = true;
    window.clearTimeout(this.loadTimeout);
    this.video.pause();

    // Request the first decodable frame without allowing free playback.
    try { this.video.currentTime = Math.min(0.01, this.video.duration); } catch {}
    this.rebuild();
  }

  rebuild() {
    if (!this.metadataReady || this.isDestroyed) return;
    this.videoTween?.kill();
    this.scrollTween?.kill();
    this.wheelUnlock.pause(0);
    this.wheelLocked = false;
    this.stepIndex = Math.round(this.video.currentTime / VIDEO_STEP_SECONDS);
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
          // Blend discrete wheel/trackpad events into a continuous playhead.
          scrub: 0.28,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            this.root.style.setProperty('--cinematic-progress', self.progress.toFixed(4));
            this.header?.classList.toggle('past-cinematic', self.progress >= 0.995);
            const scrollStep = Math.round(self.progress * this.maxStepIndex());
            if (!this.wheelLocked && scrollStep !== this.stepIndex) this.animateToStep(scrollStep);
          },
          onLeave: () => this.header?.classList.add('past-cinematic'),
          onEnterBack: () => this.header?.classList.remove('past-cinematic'),
        },
      });

      this.timeline
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

  maxStepIndex() {
    return Math.max(1, Math.floor((this.video.duration - 0.04) / VIDEO_STEP_SECONDS));
  }

  handleWheel(event) {
    if (!this.metadataReady || this.motionQuery.matches || event.ctrlKey || Math.abs(event.deltaY) < 6) return;
    const trigger = this.timeline?.scrollTrigger;
    const rect = this.root.getBoundingClientRect();
    const isPinned = trigger?.isActive || (rect.top <= 1 && rect.bottom >= window.innerHeight);
    if (!isPinned) return;

    const direction = Math.sign(event.deltaY);
    const nextStep = gsap.utils.clamp(0, this.maxStepIndex(), this.stepIndex + direction);
    if (nextStep === this.stepIndex && !this.wheelLocked) return;

    if (event.cancelable) event.preventDefault();
    if (this.wheelLocked) return;

    this.wheelLocked = true;
    this.wheelUnlock.restart(true);
    this.animateToStep(nextStep);
    this.scrollToStep(nextStep);
  }

  animateToStep(step) {
    if (!this.metadataReady || this.video.readyState < HTMLMediaElement.HAVE_METADATA) return;
    const nextStep = gsap.utils.clamp(0, this.maxStepIndex(), step);
    const targetTime = Math.min(this.video.duration - 0.04, nextStep * VIDEO_STEP_SECONDS);
    const playhead = { time: this.video.currentTime };
    this.stepIndex = nextStep;
    this.video.pause();
    this.videoTween?.kill();
    this.videoTween = gsap.to(playhead, {
      time: targetTime,
      duration: 1.2,
      ease: 'power2.inOut',
      overwrite: true,
      onUpdate: () => {
        try { this.video.currentTime = playhead.time; } catch {}
      },
      onComplete: () => {
        try { this.video.currentTime = targetTime; } catch {}
      },
    });
  }

  scrollToStep(step) {
    const trigger = this.timeline?.scrollTrigger;
    if (!trigger) return;
    const scrollState = { y: window.scrollY };
    const targetY = trigger.start + ((trigger.end - trigger.start) * step / this.maxStepIndex());
    this.scrollTween?.kill();
    this.scrollTween = gsap.to(scrollState, {
      y: targetY,
      duration: 1.05,
      ease: 'power2.inOut',
      overwrite: true,
      onUpdate: () => window.scrollTo(0, scrollState.y),
    });
  }

  applyReducedMotion() {
    this.videoTween?.kill();
    this.scrollTween?.kill();
    this.root.classList.add('is-reduced');
    this.video.pause();
    try { this.video.currentTime = 0; } catch {}
    this.revealVideo();
  }

  revealVideo() {
    this.video.classList.add('is-ready');
    this.loading?.classList.add('is-hidden');
  }

  activateFallback(message) {
    if (this.isDestroyed) return;
    window.clearTimeout(this.loadTimeout);
    this.videoTween?.kill();
    this.scrollTween?.kill();
    this.context?.revert();
    this.context = null;
    this.timeline = null;
    this.video.pause();
    this.root.classList.add('is-fallback');
    this.video.classList.add('is-ready');
    if (this.loading) {
      const status = this.loading.querySelector('[data-loading-status]');
      if (status) status.textContent = message;
      this.loading.classList.add('is-hidden');
    }
    this.header?.classList.add('past-cinematic');
  }

  async primeVideo() {
    if (!this.metadataReady || this.motionQuery.matches || this.isDestroyed) return;
    try {
      await this.video.play();
      this.video.pause();
    } catch {
      // Muted inline seeking still works on most browsers without priming.
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    window.clearTimeout(this.loadTimeout);
    this.abortController.abort();
    this.resizeRefresh.kill();
    this.wheelUnlock.kill();
    this.videoTween?.kill();
    this.scrollTween?.kill();
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
