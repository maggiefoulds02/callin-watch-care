"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { HeroWatchModel } from "./hero-watch-model";

/**
 * Lighting matches the exploded-view scene (see watch-scene.tsx) so the
 * watch looks like the same physical object in both places. The camera
 * differs: static (no scroll-driven progress), framed a little closer since
 * there's no explode/rotation motion to leave clipping margin for — only
 * the straps drifting off the top/bottom edges, which is intentional here.
 */
export function HeroWatchScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.9, 6.4], fov: 26 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -1, -3]} intensity={0.4} color="#7c8aa0" />
      <Environment resolution={256} background={false}>
        <group>
          <Lightformer
            form="rect"
            intensity={3}
            color="#eef2f6"
            scale={[8, 5, 1]}
            position={[0, 5, 4]}
            rotation={[-Math.PI / 4, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            color="#9aa7b8"
            scale={[5, 5, 1]}
            position={[-6, 1, 1]}
            rotation={[0, Math.PI / 2.4, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1}
            color="#c9a24a"
            scale={[4, 4, 1]}
            position={[5, 0, -3]}
            rotation={[0, -Math.PI / 2.4, 0]}
          />
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
      <HeroWatchModel />
    </Canvas>
  );
}
