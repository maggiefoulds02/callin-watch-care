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

const BRASS = "#c9a24a";
const SILVER = "#c9d3de";

// Node names inside the source model (see watch-3d/README below) that make
// up each part we explode. Everything not listed here (the case body) is
// the static reference the other parts move away from.
const GROUP_NODE_NAMES = {
  crystal: ["Curved_glass"],
  bezel: ["Rotating_Bezel_SUB"],
  crown: ["Adjustment_Wheels_SUB"],
  dial: ["Watch_dial"],
  caseBack: ["Bellow_case_2.0"],
} as const;

type GroupKey = keyof typeof GROUP_NODE_NAMES;

// How far each group travels, and along which local axis, when fully
// exploded — tuned to this model's own scale (roughly a 0.77-unit-diameter,
// 0.2-unit-thick disc centred on the origin after processing).
const EXPLODE: Record<GroupKey, { axis: "y" | "radial"; distance: number; sign: 1 | -1 }> = {
  crystal: { axis: "y", distance: 0.42, sign: 1 },
  bezel: { axis: "y", distance: 0.28, sign: 1 },
  crown: { axis: "radial", distance: 0.3, sign: 1 },
  dial: { axis: "y", distance: 0.15, sign: 1 },
  caseBack: { axis: "y", distance: 0.42, sign: -1 },
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

  // The model ships with no visible internal movement (this is a marketing
  // render asset — the case back is solid, not modelled hollow), so we add
  // a simple, clearly-stylised brass disc for that one step, matching how
  // the site's earlier hand-built diagram represented it.
  const movementRest = useMemo(() => new THREE.Vector3(0, -0.05, 0), []);
  const movementRef = useRef<THREE.Group>(null);
  const movementTarget = useMemo(() => new THREE.Vector3(), []);

  const targetScratch = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (spinGroup.current) {
      spinGroup.current.rotation.y += delta * 0.22;
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

      if (cfg.axis === "y") {
        targetScratch.set(restPos.x, restPos.y + cfg.distance * cfg.sign * e, restPos.z);
      } else {
        // Radial: push outward along this part's own rest direction from
        // the case centre, so the crown (off-centre in X/Z) moves outward
        // rather than along an arbitrary fixed axis.
        const dir = new THREE.Vector3(restPos.x, 0, restPos.z).normalize();
        targetScratch.copy(restPos).addScaledVector(dir, cfg.distance * e);
      }
      obj.position.lerp(targetScratch, lerpFactor);
    }

    // Movement placeholder — travels across the union of the "Movement"
    // and "Case back" legend ranges, since one real piece (the case back
    // shell) is doing the work of illustrating both steps.
    const [mStart] = RANGE["Movement"];
    const [, cEnd] = RANGE["Case back"];
    const mE = Math.min(1, Math.max(0, (progress - mStart) / (cEnd - mStart || 1)));
    movementTarget.set(movementRest.x, movementRest.y - 0.3 * mE, movementRest.z);
    if (movementRef.current) {
      movementRef.current.position.lerp(movementTarget, lerpFactor);
    }
  });

  return (
    <group ref={spinGroup} rotation={[0.15, 0, 0]} scale={3.6}>
      <primitive object={model} />
      <group ref={movementRef} position={movementRest}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 48]} />
          <meshStandardMaterial color={BRASS} metalness={0.75} roughness={0.35} />
        </mesh>
        {[
          [0.11, 0.09],
          [-0.09, 0.04],
          [0, -0.11],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.03, z]}>
            <cylinderGeometry args={[0.06, 0.06, 0.03, 20]} />
            <meshStandardMaterial color={SILVER} metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
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
    case "crown":
      return "Crown";
    case "dial":
      return "Dial & hands";
    case "caseBack":
      return "Case back";
  }
}
