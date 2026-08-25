# Scroll Video Encoding

The homepage scrubs `public/videos/onyx-scroll.mp4` (published as `/videos/onyx-scroll.mp4`) with the scroll position. Random seeking is smoother when the source contains frequent keyframes and has no audio track.

## Option A: maximum seeking performance

```bash
ffmpeg -i onyx-master.mp4 -c:v libx264 -preset slow -crf 20 -g 1 -keyint_min 1 -sc_threshold 0 -an -pix_fmt yuv420p -movflags +faststart public/videos/onyx-scroll.mp4
```

`-g 1` makes every frame an I-frame. This gives the best random seeking behavior, but can make the file much larger. Use it when the sequence is short or the visual quality and responsiveness justify the bandwidth.

## Option B: balanced production encode

```bash
ffmpeg -i onyx-master.mp4 -c:v libx264 -preset slow -crf 21 -g 12 -keyint_min 12 -sc_threshold 0 -an -pix_fmt yuv420p -movflags +faststart public/videos/onyx-scroll.mp4
```

A 6-12 frame GOP is a practical compromise: it reduces file size while keeping seek corrections frequent enough for a scroll-controlled hero. Match the GOP to the source frame rate when possible.

## Mobile recommendation

Create a smaller portrait or responsive crop at 720p, lower bitrate, and a 6-frame GOP:

```bash
ffmpeg -i onyx-master.mp4 -vf "scale=-2:720" -c:v libx264 -preset medium -crf 24 -g 6 -keyint_min 6 -sc_threshold 0 -an -pix_fmt yuv420p -movflags +faststart public/videos/onyx-scroll-mobile.mp4
```

The hero automatically probes `/videos/onyx-scroll-mobile.mp4` on narrow portrait screens. If that optional file is absent, it keeps using `/videos/onyx-scroll.mp4`; if video seeking is unavailable, it degrades to the poster and keeps the HTML copy and booking CTA usable.

## Recommended production choice

Start with **Option B** (`-g 12`) and test the real source on Safari and mid-range Android hardware. Move toward a 6-frame GOP if seeking is still visibly coarse. Reserve Option A (`-g 1`) for short sequences or controlled installations because its bandwidth and storage cost can be several times higher.

Keep the video silent, H.264, `yuv420p`, and `faststart` enabled. After replacing an encode, confirm that duration metadata is finite and that seeking works both forward and backward before publishing.

## Runtime tuning

- Scroll distance: change `--cinematic-scroll-length` in `styles.css` (desktop defaults to `600vh`, mobile to `500vh`).
- Copy timing: edit the normalized `ONYX_SCROLL_TIMINGS` values in `components/OnyxScrollHero.js`.
- Booking destination: the final CTA uses the existing `#booking` target in `index.html`.
