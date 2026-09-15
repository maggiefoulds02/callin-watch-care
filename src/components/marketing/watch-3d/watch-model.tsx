"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { WATCH_PARTS } from "../watch-parts-data";

// Serve Draco decoding from our own /public/draco (copied from three's own
// examples) rather than drei's default gstatic.com CDN default — keeps this
// feature free of a runtime dependency on a host outside our own deploy.
useGLTF.setDecoderPath("/draco/");

const MODEL_URL = "/models/watch.glb";
useGLTF.preload(MODEL_URL);

const RANGE = Object.fromEntries(WATCH_PARTS.map((p) => [p.label, p.range])) as Record<
  string,
  [number, number]
>;

const MOVEMENT_METAL = "#9ea7b1";

// Node names inside the source model (see watch-3d/README below) that make
// up each part we explode. Everything not listed here (the case body) is
// the static reference the other parts move away from.
//
// The crown is handled separately below, not here: "Adjustment_Wheels_SUB"
// (the obvious node to reach for) actually bundles three sub-parts —
// the real winding crown, sitting dead-centre on one side of the case, plus
// two more meshes off at an angle (almost certainly the helium escape
// valve — a second, smaller crown-like fitting real dive watches like the
// Seamaster have on the case side). Exploding the whole bundle along one
// direction dragged the valve along with the crown and, since a single
// direction can't suit both, made the crown itself drift off at a slight
// angle instead of straight out. Only the actual crown moves now; the
// valve stays put as part of the case, same as any other unlabelled detail.
const GROUP_NODE_NAMES = {
  crystal: ["Curved_glass"],
  bezel: ["Rotating_Bezel_SUB"],
  dial: ["Watch_dial"],
  caseBack: ["Bellow_case_2.0"],
} as const;

const CROWN_NODE_NAME = "Adjustment_Wheels_A";
const CROWN_EXPLODE_DISTANCE = 0.24;

// The three hand nodes, each already sitting on its own local pivot at the
// dial's centre (see watch-3d/README) — spinning each one around its own
// local Y axis (the axis running through the case, face-to-back) reads as
// "the watch is running" without disturbing the pivot the modeller baked
// in. Kept independent of scroll progress so the hands never stop, even
// while a part is mid-explode. Rates are stylised (not real 12/60/60
// ratios) — picked so the second hand reads as a clear, lively sweep
// without looking frantic.
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

type GroupKey = keyof typeof GROUP_NODE_NAMES;

// How far each group travels, and along which local axis, when fully
// exploded — tuned to this model's own scale (roughly a 0.77-unit-diameter,
// 0.2-unit-thick disc centred on the origin after processing). These are
// deliberately a bit shorter than the model's overall scale alone would
// suggest: the case rendering bigger (see the group's `scale` below) was
// worth more travel room than it was worth explode drama, so distances
// were pulled in by the same factor scale went up by, keeping each part's
// actual on-screen separation about the same as before.
const EXPLODE: Record<GroupKey, { distance: number; sign: 1 | -1 }> = {
  crystal: { distance: 0.336, sign: 1 },
  bezel: { distance: 0.224, sign: 1 },
  dial: { distance: 0.12, sign: 1 },
  caseBack: { distance: 0.336, sign: -1 },
};

/**
 * The real, detailed Omega Seamaster CAD model Maggie supplied — with
 * Omega's own logo/wordmark stripped out (see the processing script this
 * was built with) so it reads as "a genuinely serious dive watch" rather
 * than a stylised placeholder, without reproducing anyone's trademark.
 * Draco-compressed and re-textured down from ~40MB to ~1MB for the web.
 *
 * Each named sub-assembly (crystal, bezel, crown, dial+hands, case back)
 * keeps its original modelled geometry and materials; we only read and
 * animate its own local `position`, so nothing needs to be re-parented out
 * of the model's original hierarchy (which would lose the pivots the
 * modeller baked in).
 */
export function WatchModel({ progressRef }: { progressRef: React.RefObject<number> }) {
  const { scene } = useGLTF(MODEL_URL);
  const spinGroup = useRef<THREE.Group>(null);

  // Clone once per mount so this component can never fight another instance
  // (or React Strict Mode's double-invoke) over the same shared Object3D
  // that drei's loader cache hands back.
  const model = useMemo(() => scene.clone(true), [scene]);

  const groups = useMemo(() => {
    const found: Partial<Record<GroupKey, THREE.Object3D>> = {};
    for (const key of Object.keys(GROUP_NODE_NAMES) as GroupKey[]) {
      for (const name of GROUP_NODE_NAMES[key]) {
        const obj = model.getObjectByName(name);
        if (obj) {
          found[key] = obj;
          break;
        }
      }
    }
    return found;
  }, [model]);

  // Rest (assembled) local position for each group, captured once — the
  // explode target is always this plus an offset, never a running total.
  const rest = useMemo(() => {
    const out: Partial<Record<GroupKey, THREE.Vector3>> = {};
    for (const key of Object.keys(groups) as GroupKey[]) {
      const obj = groups[key];
      if (obj) out[key] = obj.position.clone();
    }
    return out;
  }, [groups]);

  // The crown: which way is "outward"? Its own node sits three levels deep
  // (Adjustment_Wheels_SUB > Adjustment_Wheels > Adjustment_Wheels_A), and
  // that middle node carries a real rotation + non-uniform scale of its
  // own — so the crown's local `.position` (relative to its immediate
  // parent) doesn't point outward from the case at all, it's just a
  // coordinate in that tilted, scaled parent frame. What *does* point
  // outward is this node's position expressed in the overall model's own
  // frame (the one that rotates rigidly with the watch, same as every
  // other exploding part below) — so we read that once, use its (x, z)
  // bearing off the case's centre axis as the explode direction, then
  // convert that direction back into the crown's own parent frame so the
  // per-frame animation can move it with a plain, cheap position lerp like
  // everything else here, instead of a world-space round trip every frame.
  const crown = useMemo(() => {
    const obj = model.getObjectByName(CROWN_NODE_NAME);
    if (!obj || !obj.parent) return null;

    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    const modelLocalPos = model.worldToLocal(worldPos.clone());
    const dirInModel = new THREE.Vector3(modelLocalPos.x, 0, modelLocalPos.z).normalize();

    // A second point a short step further out along that same direction,
    // round-tripped through world space into the parent's frame, gives us
    // the direction as seen from there (once — nothing above the crown
    // moves, so this fixed conversion stays valid for the whole session).
    // Deliberately left un-normalized: the crown's immediate parent has its
    // own non-uniform scale (this model's crown assembly sits inside a
    // node scaled to ~0.84), so a plain unit vector in parent-local space
    // would under-shoot the intended travel once that scale is applied —
    // dividing by the step size instead gives "parent-local units per
    // model-space unit", which cancels that scale out so `distance` below
    // means the same real-world thing it does for every other part.
    const STEP = 0.05;
    const stepModel = modelLocalPos.clone().addScaledVector(dirInModel, STEP);
    const stepWorld = model.localToWorld(stepModel);
    const stepInParent = obj.parent.worldToLocal(stepWorld);
    const dirInParent = stepInParent.sub(obj.position).divideScalar(STEP);

    return { obj, rest: obj.position.clone(), dir: dirInParent };
  }, [model]);

  const hands = useMemo(() => {
    const out: Partial<Record<keyof typeof HAND_NODE_NAMES, THREE.Object3D>> = {};
    for (const key of Object.keys(HAND_NODE_NAMES) as (keyof typeof HAND_NODE_NAMES)[]) {
      const obj = model.getObjectByName(HAND_NODE_NAMES[key]);
      if (obj) out[key] = obj;
    }
    return out;
  }, [model]);

  // The model ships with no visible internal movement (this is a marketing
  // render asset — the case back is solid, not modelled hollow), so we add
  // a simple, clearly-stylised silver disc for that one step, matching how
  // the site's earlier hand-built diagram represented it.
  const movementRest = useMemo(() => new THREE.Vector3(0, -0.05, 0), []);
  const movementRef = useRef<THREE.Group>(null);
  const movementTarget = useMemo(() => new THREE.Vector3(), []);

  const targetScratch = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (spinGroup.current) {
      spinGroup.current.rotation.y += delta * 0.22;
    }

    for (const key of Object.keys(hands) as (keyof typeof HAND_NODE_NAMES)[]) {
      hands[key]?.rotateY(delta * HAND_SPEEDS[key]);
    }

    const progress = progressRef.current ?? 0;
    const lerpFactor = 1 - Math.pow(0.001, delta);

    for (const key of Object.keys(groups) as GroupKey[]) {
      const obj = groups[key];
      const restPos = rest[key];
      if (!obj || !restPos) continue;

      const [start, end] = RANGE[labelFor(key)];
      const e = Math.min(1, Math.max(0, (progress - start) / (end - start || 1)));
      const cfg = EXPLODE[key];

      targetScratch.set(restPos.x, restPos.y + cfg.distance * cfg.sign * e, restPos.z);
      obj.position.lerp(targetScratch, lerpFactor);
    }

    if (crown) {
      const [start, end] = RANGE["Crown"];
      const e = Math.min(1, Math.max(0, (progress - start) / (end - start || 1)));
      targetScratch.copy(crown.rest).addScaledVector(crown.dir, CROWN_EXPLODE_DISTANCE * e);
      crown.obj.position.lerp(targetScratch, lerpFactor);
    }

    // Movement placeholder — travels across the union of the "Movement"
    // and "Case back" legend ranges, since one real piece (the case back
    // shell) is doing the work of illustrating both steps. Kept short and
    // close to the case (rather than fully separated, as the real parts
    // are) since it's a stand-in shape rather than modelled geometry — the
    // less it's pulled into open air, the less that shows.
    const [mStart] = RANGE["Movement"];
    const [, cEnd] = RANGE["Case back"];
    const mE = Math.min(1, Math.max(0, (progress - mStart) / (cEnd - mStart || 1)));
    movementTarget.set(movementRest.x, movementRest.y - 0.128 * mE, movementRest.z);
    if (movementRef.current) {
      movementRef.current.position.lerp(movementTarget, lerpFactor);
    }
  });

  return (
    // Scale (and the camera framing in watch-scene.tsx) were pulled back
    // together from an earlier, tighter fit that clipped against the
    // canvas edges: the case's lugs stick out well past its own diameter,
    // and as the whole watch keeps slowly turning, those lugs swing close
    // enough to the frustum edge at some angles to poke out of frame —
    // worse once parts are exploded outward on top of that. Verified with
    // a scripted sweep across a full rotation, at rest and fully exploded,
    // checking every part's projected screen-space extent stays safely
    // inside the frustum rather than just eyeballing a couple of angles.
    <group ref={spinGroup} rotation={[0.15, 0, 0]} scale={3}>
      <primitive object={model} />
      <group ref={movementRef} position={movementRest}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.014, 48]} />
          <meshStandardMaterial color={MOVEMENT_METAL} metalness={0.92} roughness={0.16} envMapIntensity={1.4} />
        </mesh>
      </group>
    </group>
  );
}

function labelFor(key: GroupKey): string {
  switch (key) {
    case "crystal":
      return "Crystal";
    case "bezel":
      return "Bezel";
    case "dial":
      return "Dial & hands";
    case "caseBack":
      return "Case back";
  }
}
