"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { WatchModel } from "./watch-model";

/** The Canvas + lighting rig. Split out from the scroll/section logic so it
 * stays easy to reuse (e.g. a future product page) independent of scroll.
 *
 * The metal parts use fairly high `metalness` (see watch-model.tsx), and a
 * metal surface with no environment to reflect renders almost black outside
 * a couple of direct specular hotspots — real metal is nearly all specular,
 * with very little diffuse response to a plain directional light. Rather
 * than pull in an HDRI file (an external asset this project has otherwise
 * avoided), drei's <Environment> can build its reflection map procedurally
 * from plain JSX <Lightformer> panels — self-authored, same as the rest of
 * the scene's geometry, just used as light sources instead of visible mesh. */
export function WatchScene({ progressRef }: { progressRef: React.RefObject<number> }) {
  return (
    <Canvas
      // Pulled back from a tighter first cut — see the comment on the
      // model's scale in watch-model.tsx for why.
      camera={{ position: [0, 1.85, 7.6], fov: 30 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -1, -3]} intensity={0.4} color="#7c8aa0" />
      <Environment resolution={256} background={false}>
        <group>
          {/* Large soft key light above/front — the main reason the case and
              bezel read as bright silver rather than dark metal. */}
          <Lightformer
            form="rect"
            intensity={3}
            color="#eef2f6"
            scale={[8, 5, 1]}
            position={[0, 5, 4]}
            rotation={[-Math.PI / 4, 0, 0]}
          />
          {/* Cool fill from the left */}
          <Lightformer
            form="rect"
            intensity={1.5}
            color="#9aa7b8"
            scale={[5, 5, 1]}
            position={[-6, 1, 1]}
            rotation={[0, Math.PI / 2.4, 0]}
          />
          {/* Warm rim from behind-right, echoes the brass movement accent */}
          <Lightformer
            form="rect"
            intensity={1}
            color="#c9a24a"
            scale={[4, 4, 1]}
            position={[5, 0, -3]}
            rotation={[0, -Math.PI / 2.4, 0]}
          />
          {/* Dim navy floor bounce so the underside isn't pure black */}
          <Lightformer
            form="rect"
            intensity={0.6}
            color="#1a3157"
            scale={[10, 10, 1]}
            position={[0, -5, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      </Environment>
      <WatchModel progressRef={progressRef} />
    </Canvas>
  );
}
