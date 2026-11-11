# UI v3 screen media

Source: [Yeolo / UI v3](https://www.figma.com/design/weM9CoT2W6nYwB6eT3H2uR/Yeolo?node-id=1018-2), lower screen set, retrieved 2026-10-22.

| Files | Figma node | Display slot |
| --- | --- | --- |
| `onboarding.mp4`, poster | `1196:175` / `1482:91` | 278 × 278 at (56, 212) |
| `taste-analysis.mp4`, poster | `1196:218` / `1523:315` | 393 × 393 at (-2, 187) |
| `course-generation.mp4`, poster | `1196:1011` | Plane/cloud timeline, 320 × 280 at (30, 145) |
| `phone.png`, `magnifier.png`, `bubble.png`, bubble lines, phone shadow | `1448:614` | Home taste artwork, original layers and rotation |
| `map.png`, `map-marker.png`, map/marker shadows | `1448:632` | Home create artwork, original layers and shadows |
| `booking-flight.png` | `1523:322` | Home flight, 60 × 60 |
| `booking-hotel.png` | `1442:364` | Home hotel, 60 × 60 |
| `booking-ticket.png` | `1442:369` | Home ticket, 59 × 59 |
| `memo.svg` | `1588:2385` | 18 × 18 tip bulb |
| `reason.svg` | `1588:2386` | 18 × 18 gradient star |

The MP4s come from Figma `export_video` at 2× resolution and retain the authored motion. Since that tool exports the enclosing timeline frame, ffmpeg cropped only the artwork rectangle, removed audio, and encoded H.264/yuv420p with faststart. Analysis uses a codec-compatible 780 × 788 crop at (0, 372); the original extends 2px past the screen. Posters are the first decoded frames of these clips. No text, progress bars, status bars or screen screenshots are used as runtime artwork.

Static PNGs/SVGs are downloaded exports/source assets. Original SVG root dimensions are retained. Shadow SVGs are rasterized with Sharp without changing their artwork so native rendering retains Gaussian blur. The app uses bundled files, with no temporary Figma URLs at runtime. Videos loop silently, pause outside the foreground, and show posters for reduced motion or playback errors. `expo-video` requires rebuilding an existing native development app after installation.

## 2026-10-22 duration correction

`onboarding.mp4` and `taste-analysis.mp4` are each exactly 4.000 seconds (120 frames at 30 fps). The original enclosing Figma frames have 2-second timelines; exporting them directly truncated the embedded 4-second clips. These assets were re-exported using temporary frame copies with 4-second timelines, then cropped spatially without changing playback speed. Temporary copies were removed and the source timelines were preserved. The second halves include the onboarding confirmation/bin and analysis category bubbles. Posters were regenerated from the corrected clips.

## 2026-10-25 course cloud loop correction

`course-generation.mp4` is exactly 1.500 seconds, 90 frames at 60 fps. The source front cloud (`1442:392`) had two translation keyframes at 1.5s with conflicting Y values (0 and 4), producing a visible jump both at the last frame and at repeat. A temporary copy of `1196:1011` was exported with one endpoint and a continuous 0 → +4 → −4 → 0 translation at 0, 0.375, 1.125 and 1.5 seconds. The front cloud uses the existing rear cloud's easing so velocity is continuous at repeat. Plane/rear-cloud motion, artwork, layout, duration and source Figma nodes were preserved. The temporary export copy was removed.

The 60-fps export is cropped to the same 640 × 560 artwork slot, retaining exactly the first 90 frames so the inclusive endpoint is not duplicated. The poster is its first decoded frame. Frame analysis of the shaded front-cloud region measured a loop-boundary luminance-centroid jump of 5.051px before and 0.351px after; the corrected maximum interior frame step is 0.404px. This checks asset continuity, not device frame delivery.

## 2026-10-27 login refresh

The latest login design is [iOS `1196:135`](https://www.figma.com/design/weM9CoT2W6nYwB6eT3H2uR/Yeolo?node-id=1196-135) and Android `1196:156`. The shared album/magnifier video is `1745:513` / `1776:87` (video fill `2db5933d9b0df51dfa5b93bf9a1efadfb1726565`). Its authored slot is 333 × 333 at (83, 240) on iOS and (83, 278) on Android.

`login.mp4` retains the complete 6.040-second clip (151 frames at 25 fps), exported from Figma at 1000 × 1000 with the high-quality preset for approximately 3× native display density. The enclosing source screen has a 2-second timeline; an isolated temporary frame with a 6.04-second timeline was used to avoid truncation, and then removed. The original Figma nodes and timeline remain unchanged. Only the redundant inclusive endpoint and audio were removed, using stream copy: SHA-256 hashes of all 151 encoded video packets match the corresponding Figma export packets. No additional resizing or lossy re-encoding is applied to the bundled video. The initial 334 × 334 draft was replaced after the user requested preserved quality.

`login-poster.png` is the full-resolution first decoded frame. Runtime uses the existing muted, foreground-only `LoopingVideo`, including reduced-motion and error fallback. At the user’s request, the Apple button retains its existing native icon and label; the draft Apple raster asset was removed. The matching standalone Google mark already exists at `assets/figma/share/google.png` and is reused. Screen renders and temporary Figma URLs are not used as runtime assets.
