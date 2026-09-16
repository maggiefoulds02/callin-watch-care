"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

useGLTF.setDecoderPath("/draco/");

const MODEL_URL = "/models/watch.glb";
useGLTF.preload(MODEL_URL);

// Same hand nodes and speeds as the exploded-view model (see watch-model.tsx)
// — kept identical so the watch reads as "the same running watch" wherever
// it appears on the site.
const HAND_NODE_NAMES = {
  hours: "Hours_hand",
  minutes: "Minutes_hand",
  seconds: "seconde_Hand",
} as const;

const HAND_SPEEDS: Record<keyof typeof HAND_NODE_NAMES, number> = {
  hours: -(Math.PI * 2) / 240,
  minutes: -(Math.PI * 2) / 48,
  seconds: -(Math.PI * 2) / 8,
};

const STRAP_COLOR = "#22262d";

// The source CAD file has no strap/band geometry at all (it was modelled as
// a marketing render of the case alone) — so both straps here are built
// procedurally.
//
// Coordinates are in the model's own local space (same frame the exploded
// view places its movement placeholder disc in — see watch-model.tsx) where
// the case+lugs silhouette spans roughly ±0.76 on both the crown axis (local
// X, confirmed by the exploded view's crown-direction math) and the
// lug/strap axis (local Z, the one axis left unaccounted for by the crown).
//
// Every control point below keeps x = 0 — the whole strap curve lives in
// the Y-Z plane, running straight back from the case with no left/right
// bend. That's deliberate: it means the curve never needs to roll around
// its own direction of travel, so the ribbon's "width" side can just stay
// pinned to world X the whole way along, rather than following a
// Frenet frame — those flip/twist unpredictably on a path this short and
// produced a warped, twisted strap the first time this was tried with
// THREE.ExtrudeGeometry's own `extrudePath` sweep.
function buildStrapGeometry(points: THREE.Vector3[], widthStart: number, widthEnd: number, thickness: number) {
  const curve = new THREE.CatmullRomCurve3(points);
  const SEGMENTS = 24;
  const samples = curve.getPoints(SEGMENTS);
  const tangents = samples.map((_, i) => curve.getTangentAt(i / SEGMENTS));

  // Ribbon cross-section at each sample: width runs along world +X, and
  // "up" (thickness) is the tangent rotated 90 degrees within the Y-Z
  // plane — a plain 2D perpendicular, so there's no sign ambiguity the way
  // there is picking a normal in full 3D.
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const half = thickness / 2;

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const width = THREE.MathUtils.lerp(widthStart, widthEnd, t);
    const p = samples[i];
    const tan = tangents[i];
    const upY = -tan.z;
    const upZ = tan.y;

    // Four corners of this cross-section: top-left, top-right, bottom-left,
    // bottom-right (top = +thickness side).
    positions.push(
      p.x - width / 2, p.y + upY * half, p.z + upZ * half,
      p.x + width / 2, p.y + upY * half, p.z + upZ * half,
      p.x - width / 2, p.y - upY * half, p.z - upZ * half,
      p.x + width / 2, p.y - upY * half, p.z - upZ * half,
    );
    normals.push(0, upY, upZ, 0, upY, upZ, 0, -upY, -upZ, 0, -upY, -upZ);
  }

  const ringStride = 4;
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * ringStride;
    const b = (i + 1) * ringStride;
    // top face (0,1), bottom face (2,3), left edge (0,2), right edge (1,3)
    indices.push(a + 0, b + 0, a + 1, a + 1, b + 0, b + 1); // top
    indices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2); // bottom
    indices.push(a + 0, a + 2, b + 0, b + 0, a + 2, b + 2); // left
    indices.push(a + 1, b + 1, a + 3, b + 1, b + 3, a + 3); // right
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

function buildStrap(zSign: 1 | -1) {
  // zSign +1 = the lug closer to camera after the model's fixed tilt (the
  // 6-o'clock side — it reads lower and larger on screen); -1 is the far,
  // 12-o'clock side, which reads higher and smaller. Each strap falls away
  // from the case toward its own side of the dial (down for the near one,
  // up for the far one) rather than both dropping the same way, so together
  // they read as one strap running past the watch top to bottom.
  const ySign = zSign; // near strap falls down (-y), far strap rises (+y)
  const points = [
    new THREE.Vector3(0, -ySign * 0.015, zSign * 0.6),
    new THREE.Vector3(0, -ySign * 0.06, zSign * 0.82),
    new THREE.Vector3(0, -ySign * 0.17, zSign * 1.05),
    new THREE.Vector3(0, -ySign * 0.34, zSign * 1.24),
    new THREE.Vector3(0, -ySign * 0.56, zSign * 1.38),
  ];
  const geometry = buildStrapGeometry(points, 0.24, 0.2, 0.055);
  const material = new THREE.MeshStandardMaterial({
    color: STRAP_COLOR,
    roughness: 0.55,
    metalness: 0.1,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = zSign === 1 ? "HeroStrapNear" : "HeroStrapFar";
  return mesh;
}

/**
 * A still, fully-assembled watch for the hero — same GLB as the exploded
 * view, same hands still ticking, but nothing explodes and nothing spins:
 * only the hands move, so the watch itself reads as "sitting there,
 * running" rather than a diagram. Two procedural straps (see above) fill in
 * the one thing the source model doesn't have.
 */
export function HeroWatchModel() {
  const { scene } = useGLTF(MODEL_URL);

  // Clone once per mount, same reasoning as the exploded view: never share
  // the loader's cached Object3D with another instance of this component.
  const model = useMemo(() => scene.clone(true), [scene]);

  const hands = useMemo(() => {
    const out: Partial<Record<keyof typeof HAND_NODE_NAMES, THREE.Object3D>> = {};
    for (const key of Object.keys(HAND_NODE_NAMES) as (keyof typeof HAND_NODE_NAMES)[]) {
      const obj = model.getObjectByName(HAND_NODE_NAMES[key]);
      if (obj) out[key] = obj;
    }
    return out;
  }, [model]);

  useEffect(() => {
    const near = buildStrap(1);
    const far = buildStrap(-1);
    model.add(near, far);
    return () => {
      model.remove(near, far);
      near.geometry.dispose();
      far.geometry.dispose();
      (near.material as THREE.Material).dispose();
      (far.material as THREE.Material).dispose();
    };
  }, [model]);

  useFrame((_, delta) => {
    for (const key of Object.keys(hands) as (keyof typeof HAND_NODE_NAMES)[]) {
      hands[key]?.rotateY(delta * HAND_SPEEDS[key]);
    }
  });

  return (
    <group rotation={[0.15, 0, 0]} scale={3}>
      <primitive object={model} />
    </group>
  );
}
