# Course generation status

Source: [Yeolo / UI v3 — 메인화면_코스 로딩](https://www.figma.com/design/weM9CoT2W6nYwB6eT3H2uR/Yeolo?node-id=1764-149), retrieved 2026-10-27.

| File | Figma layer | Rendered slot |
| --- | --- | --- |
| `loading-track.svg` | `1764:268` | 35 × 35, including the 7pt stroke around the 28pt circle |
| `loading-arc.svg` | `1764:269` | Original reference; runtime uses a proportional SVG circle in the same 35 × 35 slot |
| `back.svg` | `1764:273` | 24 × 24, rotated 180° in the outer wrapper |

Unmodified Figma exports retain their original root dimensions. At the user's request, the runtime arc no longer rotates. A 7pt stroke at radius 14 fills clockwise from the top using the exact same `Animated.Value` as the course-generation screen's progress bar. Butt caps keep the visible arc length proportional even at small percentages. Navigation owns the estimate so leaving or reopening the generation screen does not restart it; only a new attempt resets progress, and only a saved course reaches 100%.

The footer shadow from `1764:253` is byte-identical (SHA-256 `f51212e2aa08da2e37d7d8cd8d01f7d7ce4c803822a428949292157ea50acdb6`) to the existing `assets/images/figma-course/date-footer-shadow.png`. That asset is reused at full footer width × 14pt, flipped vertically as in the design. The 350 × 76 card uses 20pt horizontal margins, 20pt top padding and 12pt bottom padding plus the device safe area.
