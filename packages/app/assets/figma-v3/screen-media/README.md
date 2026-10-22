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
