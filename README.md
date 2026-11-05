# Gameplan Website

Gameplan's bilingual (English/Arabic) Next.js 16 homepage, with a custom, scroll-linked interactive 3D experience built using Anime.js v4 and Three.js.

## Setup

Requires Node.js 20+.

```bash
npm ci
npm run dev
```

Visit `http://localhost:3000/en` or `http://localhost:3000/ar`.

For production:

```bash
npm run build
npm run start
```

## Interactive form study

The first four chapters are connected by a **single particle system** that stays on screen as the user scrolls:

| Chapter | 3D shape | Interaction |
| --- | --- | --- |
| Home | Abstract particle orb | Mouse movement gently pushes and scatters nearby particles |
| About | Soccer, basketball, and tennis balls | The orb flows down and splits into three recognizable balls |
| Ventures | Construction front loader | The balls dissolve and assemble into a loader with wheels, cab, arms, and bucket |
| Advisory | Steel vault | The loader reforms into a steel safe with a circular lock door |

The 3D scene fades out before the Process and Apply sections, which keep their original functional content.

- `components/ui/morphing-particle-scene.tsx`: WebGL render loop, real 3D geometric details, cursor interaction, animation management, responsive sizing, cleanup, and reduced-motion handling.
- `lib/morph-shapes.ts`: Deterministic particle targets, point colors, and interpolation-ready arrays.
- `app/gameplan.css`: Responsive placement and premium dark styling.
- `components/gameplan-home.tsx`: Scene integration and chapter scrolling.
- `i18n/translations.ts`: English and Arabic scene descriptions.

Anime.js `onScroll` synchronizes the 3D morph with the native scroll position, including Lenis smooth scrolling. Particle counts are reduced on mobile, geometry is created once per mount, and scene resources are cleaned up on unmount. It does not fetch external 3D models or images. If WebGL isn't supported, the site remains navigable.

## Customizing the experience

Change the four shapes in `lib/morph-shapes.ts` and the supplemental solid/wireframe details in `components/ui/morphing-particle-scene.tsx`. To adjust how early each transformation completes, edit the `0.29` viewport threshold in `resize()` in the scene component. The stage-to-section mapping is `home`, `about`, `ventures`, `advisory`.
