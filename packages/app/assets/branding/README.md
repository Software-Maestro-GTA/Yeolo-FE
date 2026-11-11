# Yeolo branding

Figma **Marketing Design → LOGO** 원본 자산입니다.

| 파일 | 원본 |
| --- | --- |
| `ios-blue-wordmark.png` | [ios_Blue_Wordmark](https://www.figma.com/design/weM9CoT2W6nYwB6eT3H2uR/Yeolo?node-id=1315-185) |
| `android-blue-wordmark.png` | [Android_Blue_Wordmark](https://www.figma.com/design/weM9CoT2W6nYwB6eT3H2uR/Yeolo?node-id=1315-196) |
| `yeolo-logo.svg` | [Yeolo_logo의 검은색 Union](https://www.figma.com/design/weM9CoT2W6nYwB6eT3H2uR/Yeolo?node-id=1315-327) |
| `reel-mark.svg` | [Frame 1029의 흰 심볼](https://www.figma.com/design/weM9CoT2W6nYwB6eT3H2uR/Yeolo?node-id=1657-1541), 내부 Frame 1028의 원본 SVG |

PNG는 Figma에 지정된 내보내기 설정을 그대로 사용합니다. Expo가 네이티브 빌드 시 플랫폼별 아이콘 크기로 변환합니다. 홈 로고는 SVG 원본을 수정하지 않고 100px 너비로 균등 축소합니다.

Expo 웹 favicon은 `android-blue-wordmark.png`를 함께 사용합니다. Expo가 브라우저용 favicon 크기로 변환하므로 별도 중복 이미지는 두지 않습니다.

Android 8 이상은 `android.adaptiveIcon`으로 런처가 지정하는 둥근 사각형·원형 마스크를 적용합니다. `android-adaptive-background.svg`는 위 Android Figma 원본의 그라데이션 배경, `android-adaptive-foreground.svg`는 동일한 흰색 워드마크 경로입니다. 로고만 중심 기준 68%로 축소해 Android의 108dp 캔버스 안 66dp 원형 안전 영역에 담습니다. 경로와 원본 색상은 유지합니다.

동명의 PNG 두 개는 SVG를 512×512로 렌더링한 Expo 빌드 입력입니다. SVG 변경 시 함께 다시 렌더링해야 합니다. 기존 `android-blue-wordmark.png`는 구형 Android의 아이콘 및 웹 favicon으로 유지합니다. 원본 전체 이미지를 adaptive foreground로 사용하면 워드마크가 잘리므로 레이어를 분리합니다.

앱 런처 아이콘 변경은 JavaScript 새로고침으로 적용되지 않으며, 네이티브 앱을 다시 빌드·설치해야 합니다.

릴스 로고는 흰색·투명 배경의 SVG를 PNG(280×326)로 렌더링한 data URI를 `src/constants/reelBrandMark.ts`에 보관합니다. 미리보기와 네이티브 렌더러가 같은 이미지를 로컬에서 사용하도록 플랜에 포함하며, 별도 중복 PNG 파일은 두지 않습니다. SVG 경로나 색상을 다시 그리지 않습니다. 갱신 시 저장소 루트의 기존 `sharp`로 SVG를 PNG 버퍼로 변환하고 base64를 상수에 반영합니다.

배치는 Marketing Design post2-1의 우측 상단 심볼 좌표(1080px 기준 x975/y51, 50×58.2197)를 720px로 비례 조정한 x650/y34, 약33.33×38.81px입니다. 소개·장소·지도 장면 모두 같은 위치에 표시합니다.
