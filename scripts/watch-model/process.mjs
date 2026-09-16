#!/usr/bin/env node
// Rebuilds public/models/watch.glb from Maggie's original CAD export.
//
// Why this exists: an earlier round hand-fixed a couple of material bugs in
// the source file and shrank it for the web, but the script that did it was
// never checked in — so when the hero section later needed the model's
// bracelet (which that earlier pass had also dropped, along with a couple
// of genuinely unwanted nodes), that work had to be reverse-engineered from
// scratch by diffing the shipped .glb against the original upload. Keeping
// this script in the repo means the next change to this asset (a new CAD
// export, a different set of parts to keep, etc.) starts from here instead.
//
// Usage:
//   cd scripts/watch-model
//   npm install   (one-time — these packages aren't part of the app itself)
//   node process.mjs <path-to-source.gltf> [output.glb]
//
// Source: Maggie's "Omega_seamaster_V3_GLTF.gltf" CAD export (a single,
// self-contained glTF with base64-embedded buffers/textures — no separate
// .bin or image files to gather).

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, dedup, weld, textureCompress, draco, unpartition } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";
import path from "node:path";

const [, , srcArg, outArg] = process.argv;
if (!srcArg) {
  console.error("Usage: node process.mjs <path-to-source.gltf> [output.glb]");
  process.exit(1);
}
const SRC = path.resolve(srcArg);
const OUT = path.resolve(outArg ?? "../../public/models/watch.glb");

// Nodes to drop entirely:
//  - Text_He / Texte_Ω: Omega's own logo/wordmark geometry — left out so the
//    site reads as "a genuinely serious dive watch" rather than reproducing
//    a trademark (the dial's own printed texture still names the brand;
//    that call was made, and not revisited, by the earlier round).
//  - Adjustment_Wheels_Details / molette_A: minor duplicate/unused detail
//    meshes on the crown, dropped by that same earlier pass.
// The bracelet (Strap_01/02, Strap_clips*, Joining_wristband_watch*,
// Watch_Metal_strap*, Clasp_parts_01 — all under one wrapper node,
// "Watch_Metal_strap_SUB") is deliberately KEPT here, unlike that earlier
// pass: the exploded-view diagram (src/components/marketing/watch-3d/
// watch-model.tsx) hides it at runtime instead, so this one file serves
// both that view and the hero's, rather than shipping two separate models.
const EXCLUDE_NODE_NAMES = new Set(["Text_He", "Texte_Ω", "Adjustment_Wheels_Details", "molette_A"]);

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

console.log("reading", SRC);
const document = await io.read(SRC);
const root = document.getRoot();

for (const node of root.listNodes()) {
  if (EXCLUDE_NODE_NAMES.has(node.getName())) {
    console.log("removing node:", node.getName());
    node.dispose();
  }
}

// The source file exports its crystal ("RS_Glass") as an opaque black
// placeholder — byte-identical, in fact, to its separate "RS_black"
// material — and its "RS_White" fully smooth (roughness 0). Fixed here,
// before dedup() runs, because dedup() otherwise treats the still-identical
// RS_Glass/RS_black pair as duplicates and merges them, which silently
// turns the crystal opaque black again (this is what "the dial looks like a
// flat black disc" turned out to be, the one time it slipped through).
for (const material of root.listMaterials()) {
  if (material.getName() === "RS_Glass") {
    material.setBaseColorFactor([0.82, 0.9, 0.97, 0.16]);
    material.setRoughnessFactor(0.05);
    material.setMetallicFactor(0);
    material.setAlphaMode("BLEND");
    material.setDoubleSided(true);
    console.log("fixed RS_Glass -> translucent");
  }
  if (material.getName() === "RS_White") {
    material.setRoughnessFactor(0.35);
    console.log("fixed RS_White -> roughness 0.35");
  }
}

// Recentre the whole assembly on the case. The case's own nodes carry
// whatever local coordinates the original CAD scene gave them — nowhere
// near this file's local origin, which sits at the bottom of the
// bracelet's clasp instead. Every consumer of this asset (the exploded
// view's camera and explode distances, the hero's camera) is tuned
// assuming the case sits at the origin, so that's corrected once here
// rather than worked around in every scene: find the case-only bounding
// box (excluding the bracelet subtree), then shift the whole scene's root
// node by the negative of its centre. Case and bracelet move together,
// keeping their real relative pose — the bracelet just ends up hanging
// further below the origin than it otherwise would, which every scene
// wants anyway.
{
  const strapNode = root.listNodes().find((n) => n.getName() === "Watch_Metal_strap_SUB");
  const isUnderStrap = (node) => {
    let n = node;
    while (n) {
      if (n === strapNode) return true;
      n = n.getParentNode();
    }
    return false;
  };

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const position = prim.getAttribute("POSITION");
      if (!position) continue;
      for (const node of root.listNodes().filter((n) => n.getMesh() === mesh)) {
        if (isUnderStrap(node)) continue;
        const m = node.getWorldMatrix();
        const v = [0, 0, 0];
        for (let i = 0; i < position.getCount(); i++) {
          position.getElement(i, v);
          const wx = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
          const wy = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
          const wz = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];
          min[0] = Math.min(min[0], wx);
          min[1] = Math.min(min[1], wy);
          min[2] = Math.min(min[2], wz);
          max[0] = Math.max(max[0], wx);
          max[1] = Math.max(max[1], wy);
          max[2] = Math.max(max[2], wz);
        }
      }
    }
  }
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  console.log("case-only world bbox centre:", center);

  for (const sceneRoot of root.listScenes()[0].listChildren()) {
    const p = sceneRoot.getTranslation();
    sceneRoot.setTranslation([p[0] - center[0], p[1] - center[1], p[2] - center[2]]);
  }
}

await document.transform(
  prune(),
  dedup(),
  weld(),
  unpartition(),
  textureCompress({ encoder: sharp, targetFormat: "webp", quality: 82 }),
  draco({ method: "edgebreaker", quantizePosition: 14, quantizeTexcoord: 12, quantizeNormal: 10 }),
);

await io.write(OUT, document);
console.log("wrote", OUT);
