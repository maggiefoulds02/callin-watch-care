# Watch model processing

Rebuilds `public/models/watch.glb` from Maggie's original Omega Seamaster
CAD export. This isn't part of the running app — it's a one-off asset tool,
kept here (with its own `package.json`) so it doesn't add native
dependencies (`sharp`) to the site's own install.

## Why this exists

An earlier pass hand-fixed a couple of material bugs in the source file and
shrank it for the web, but the script that did it was never checked in.
When the hero section later needed the model's bracelet — which that pass
had also dropped, along with a couple of genuinely unwanted nodes — that
work had to be reverse-engineered from scratch by diffing the shipped
`.glb` against the original upload. Keeping this script means the next
change to this asset starts from here instead.

## Usage

```
cd scripts/watch-model
npm install
node process.mjs <path-to-source.gltf> [output.glb]
```

`output.glb` defaults to `../../public/models/watch.glb`.

The source is Maggie's `Omega_seamaster_V3_GLTF.gltf` — a single,
self-contained glTF file (buffers and textures embedded as base64, no
separate `.bin` or image files to gather).

## What it does

- Drops Omega's own logo/wordmark geometry (`Text_He`, `Texte_Ω`) and a
  couple of unused duplicate detail meshes on the crown
  (`Adjustment_Wheels_Details`, `molette_A`).
- Keeps the bracelet (`Watch_Metal_strap_SUB` and everything under it) —
  the exploded-view diagram hides it at runtime instead (see
  `src/components/marketing/watch-3d/watch-model.tsx`), so this one file
  serves both that view and the hero's.
- Fixes two material bugs baked into the source export: the crystal
  (`RS_Glass`) comes out as an opaque black placeholder — byte-identical to
  the separate `RS_black` material, which is why this has to happen
  *before* `dedup()` runs, not after — and `RS_White` comes out fully
  smooth (mirror-flares under the site's lighting).
- Recentres the whole assembly on the case: the source file's own origin
  sits at the bottom of the bracelet's clasp, not the case, which would
  otherwise mean re-tuning every scene's camera for this file's own,
  arbitrary coordinate system.
- Draco-compresses geometry and converts textures to WebP.
