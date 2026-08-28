# As You Wish

A creative notes & canvas app — Pinterest × scrapbook × infinite canvas × Word-like editing familiarity.

This is **Pass 2**: the aesthetic & creative-UX upgrade, built on top of Pass 1's working canvas core (persistence, pan/zoom, selection, move/resize/rotate — all untouched and preserved).

## What's in this pass

- **Visual identity** — blush / lavender / sage / butter / sky palette on warm paper, DM Sans (UI) + Fraunces (editorial) + Caveat (handwritten), applied via `src/styles/tokens.css`
- **Scrapbook library** — masonry notebook grid with layered-paper, tape, and cover-art collage covers; search, favorites, archive
- **SVG icon system** (`src/components/Icon.tsx`) — every interface control uses a hand-authored stroke icon; no emoji as UI chrome (emoji/symbols are still used for canvas *content* — stickers, cover decoration — which is a deliberate, different thing)
- **Drawing tool** — pencil/pen freehand strokes with color, width, and opacity controls, stylus/touch/mouse aware. Points accumulate in a ref and the SVG path is updated via `requestAnimationFrame`-batched `setAttribute` during the stroke — no React state, no re-render — and the whole stroke becomes one `CanvasObject` (one store write, one persistence write) on lift
- **Image frames** — none / polaroid / paper / tape / film / torn, switchable per-image from the contextual toolbar
- **Stickers** — a curated symbol picker; move/resize/rotate/lock/layer/delete like any other object
- **Text highlight & underline** — soft pastel highlight presets (not neon), applied as a rounded marker-style wash
- **Canvas backgrounds** — blank / dotted / grid / lined / paper / blush / lavender / sage / sky, switchable per-notebook from a picker in the top bar
- **Tool switching** — select vs. draw mode, with a visible toggle in the top bar and `Esc` to exit drawing
- **Tablet-first touch targets** — larger hit areas for toolbar buttons and resize/rotate handles under `pointer: coarse`, alongside the existing pinch-zoom / two-finger-pan / stylus support

Everything from Pass 1 — IndexedDB persistence, debounced autosave, pan/zoom, marquee select, move/resize/rotate gestures, keyboard shortcuts — is unchanged in behavior. `src/lib/db.ts`, `src/canvas/useCamera.ts`, and `src/canvas/useObjectGesture.ts` were not modified in this pass.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Best tested on iPad Safari with Apple Pencil for the touch/stylus interactions (pinch-zoom, two-finger pan, touch-drag, drawing).

To build for production:

```bash
npm run build
npm run preview
```

## Architecture notes

- **Canvas rendering**: a single CSS-transformed "world" `<div>` containing absolutely-positioned object nodes — not raw canvas pixel drawing. Freehand drawing objects are SVG `<path>` elements stored with their own local coordinate space, so they resize/rotate through the exact same handles as every other object with no special-casing.
- **Performance**: dragging, resizing, rotating, panning, zooming, and now freehand drawing all update the DOM directly via refs during the gesture (no React re-render per frame), and only commit to the Zustand store — which triggers persistence — once the gesture ends.
- **State**: `notebookStore` (the library) and `canvasStore` (the open canvas), plus a small `activeTool`/`drawSettings` slice added this pass so the toolbar can control in-progress and future strokes without threading props through the whole tree.
- **Persistence & backward compatibility**: every new object field (`underline`, `highlight`, `frame`, `caption`, the `drawing`/`sticker` object types, the new background variants) is optional or additive to the existing discriminated union, so notebooks created in Pass 1 continue to open and render correctly with sensible defaults — no migration step, no `db.ts` changes needed.
- **Icons**: `src/components/Icon.tsx` is a small dependency-free stroke-icon set (SVG paths keyed by name) rather than an icon library, keeping the bundle light.

## What's not built yet

Following the phased approach, later passes will add: eraser tool, richer sticker sets (including user-uploaded sticker assets — the `StickerObjectData.assetSrc` field is already reserved for this), image crop/rotate/filters, custom saved themes, clipboard-smart-paste, command palette (⌘K), export/import, and dark mode.
