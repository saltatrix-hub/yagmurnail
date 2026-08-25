# Scroll Video Encoding

The homepage scrubs `videos/onyx-scroll.mp4` with the scroll position. Random seeking is smoother when the source contains frequent keyframes and has no audio track.

## Option A: maximum seeking performance

```bash
ffmpeg -i onyx-master.mp4 -c:v libx264 -preset slow -crf 20 -g 1 -keyint_min 1 -sc_threshold 0 -an -pix_fmt yuv420p -movflags +faststart videos/onyx-scroll.mp4
```

`-g 1` makes every frame an I-frame. This gives the best random seeking behavior, but can make the file much larger. Use it when the sequence is short or the visual quality and responsiveness justify the bandwidth.

## Option B: balanced production encode

```bash
ffmpeg -i onyx-master.mp4 -c:v libx264 -preset slow -crf 21 -g 12 -keyint_min 12 -sc_threshold 0 -an -pix_fmt yuv420p -movflags +faststart videos/onyx-scroll.mp4
```

A 6-12 frame GOP is a practical compromise: it reduces file size while keeping seek corrections frequent enough for a scroll-controlled hero. Match the GOP to the source frame rate when possible.

## Mobile recommendation

Create a smaller portrait or responsive crop at 720p, lower bitrate, and a 6-frame GOP:

```bash
ffmpeg -i onyx-master.mp4 -vf "scale=-2:720" -c:v libx264 -preset medium -crf 24 -g 6 -keyint_min 6 -sc_threshold 0 -an -pix_fmt yuv420p -movflags +faststart videos/onyx-scroll-mobile.mp4
```

The current implementation uses the desktop source on all devices and degrades to a poster if the video cannot load. A mobile source can be wired in `app.js` by selecting `videos/onyx-scroll-mobile.mp4` for narrow viewports.
