"use client";

import { useMemo } from "react";
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

/**
 * A still, fully-assembled watch for the hero — same GLB as the exploded
 * view, same hands still ticking, but nothing explodes and nothing spins:
 * only the hands move, so the watch itself reads as "sitting there,
 * running" rather than a diagram.
 *
 * Unlike the exploded view (which hides it — see watch-model.tsx), this is
 * the one place on the site that shows the model's real metal bracelet: the
 * original CAD file Maggie supplied does include one, it just wasn't carried
 * into the smaller, case-only asset the exploded diagram used to use.
 * public/models/watch.glb was reprocessed to keep the "Watch_Metal_strap_SUB"
 * assembly that export drops, and re-centred on the case (the case's own
 * coordinates sit well off the source file's origin — nearer the bottom of
 * the bracelet's clasp — so without that step every consumer of this file,
 * this one included, would need its own camera workaround). The bracelet
 * hangs down from the case and off the bottom of this view, same as it would
 * in a product photo.
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

  useFrame((_, delta) => {
    for (const key of Object.keys(hands) as (keyof typeof HAND_NODE_NAMES)[]) {
      hands[key]?.rotateY(delta * HAND_SPEEDS[key]);
    }
  });

  return (
    // Tilted noticeably more than the exploded view's own 0.15 rad (that
    // view stays as it was — see watch-model.tsx) so the dial itself is the
    // thing on display here, closer to looking straight down at the face
    // than across it. The small negative Z rotation is a roll — a ~12°
    // clockwise tilt of the whole watch as seen on screen, purely stylistic.
    <group rotation={[0.55, 0, -0.2094]} scale={3}>
      <primitive object={model} />
    </group>
  );
}
