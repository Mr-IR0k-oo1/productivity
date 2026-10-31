"use client";

import { useGSAP } from "@gsap/react";
import { Stars, Trail } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type RefObject, useMemo, useRef } from "react";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const INDIGO = new THREE.Color("#8b7cff");
const BONE = new THREE.Color("#f5efe8");
const SLATE = new THREE.Color("#4a5070");
const FLARE = new THREE.Color("#ff8a3d");

type BodyStatus = "done" | "active" | "todo";

/** Orbits of the hero system: radius, tilt and how many issues ride on each. */
const ORBITS = [
  { radius: 1.7, tilt: [0.35, 0, 0.12], speed: 0.22, bodies: ["done", "done", "active", "done", "todo"] },
  { radius: 2.55, tilt: [-0.22, 0, -0.3], speed: 0.14, bodies: ["done", "active", "todo", "done", "done", "todo", "active"] },
  { radius: 3.45, tilt: [0.12, 0, 0.42], speed: 0.09, bodies: ["todo", "done", "done", "active", "todo", "done", "todo", "done"] },
] as const satisfies ReadonlyArray<{ radius: number; tilt: readonly [number, number, number]; speed: number; bodies: readonly BodyStatus[] }>;

/** Soft radial sprite used for every glow, generated once instead of shipping an image. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.45)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function Glow({ texture, color, scale, opacity = 1 }: { texture: THREE.Texture; color: THREE.Color; scale: number; opacity?: number }) {
  return (
    <sprite scale={[scale, scale, 1]}>
      <spriteMaterial map={texture} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

function Body({ status, texture }: { status: BodyStatus; texture: THREE.Texture }) {
  const color = status === "done" ? INDIGO : status === "active" ? BONE : SLATE;
  const size = status === "todo" ? 0.055 : 0.075;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[size, 20, 20]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {status !== "todo" ? <Glow texture={texture} color={color} scale={status === "done" ? 0.75 : 0.55} opacity={0.85} /> : null}
    </group>
  );
}

function Orbit({ index, texture, animate }: { index: number; texture: THREE.Texture; animate: boolean }) {
  const orbit = ORBITS[index];
  const spin = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (animate && spin.current) spin.current.rotation.y += delta * orbit.speed;
  });

  return (
    <group rotation={orbit.tilt as unknown as THREE.Euler}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[orbit.radius, 0.004, 6, 220]} />
        <meshBasicMaterial color={BONE} transparent opacity={0.16} toneMapped={false} />
      </mesh>
      <group ref={spin}>
        {orbit.bodies.map((status, i) => {
          const angle = (i / orbit.bodies.length) * Math.PI * 2 + index;
          return (
            <group key={i} position={[Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius]}>
              <Body status={status} texture={texture} />
            </group>
          );
        })}
      </group>
    </group>
  );
}

/** The flare: the sprint's clock, circling the outer orbit with a fading trail. */
function Satellite({ texture, animate }: { texture: THREE.Texture; animate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const radius = 4.2;
  const start = useRef(Math.PI * 0.35);

  useFrame((state) => {
    if (!ref.current) return;
    const t = start.current + (animate ? state.clock.elapsedTime * 0.32 : 0);
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 0.9) * 0.55, Math.sin(t) * radius);
  });

  const body = (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshBasicMaterial color={FLARE} toneMapped={false} />
      </mesh>
      <Glow texture={texture} color={FLARE} scale={1.1} />
    </group>
  );

  // drei's Trail can't run with zero length, so a still scene skips it.
  if (!animate) return body;

  return (
    <Trail width={1.4} length={7} color={FLARE} attenuation={(w) => w * w} decay={1.2}>
      {body}
    </Trail>
  );
}

function System({
  triggerRef,
  animate,
  offset,
}: {
  triggerRef: RefObject<HTMLElement | null>;
  animate: boolean;
  offset: [number, number, number];
}) {
  const texture = useGlowTexture();
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // One orchestrated intro, then a scroll-linked camera move. Skipped entirely for reduced motion.
  useGSAP(
    () => {
      if (!animate || !root.current || !tilt.current) return;
      const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
      timeline
        .from(camera.position, { z: 17, y: 3, duration: 2.8 }, 0)
        .from(root.current.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 2.4 }, 0.1)
        .from(root.current.rotation, { y: -1.2, duration: 3 }, 0);

      // Scroll moves the system, never the camera, so it can't fight the intro's camera tween.
      if (triggerRef.current) {
        const scroll = { trigger: triggerRef.current, start: "top top", end: "bottom top", scrub: 1.2 };
        gsap.to(tilt.current.rotation, { x: 0.6, ease: "none", scrollTrigger: scroll });
        gsap.to(tilt.current.position, { y: 2.2, z: -3, ease: "none", scrollTrigger: scroll });
      }
    },
    { dependencies: [animate] },
  );

  useFrame((state, delta) => {
    if (!animate || !root.current) return;
    // Ease toward the pointer for a gentle parallax.
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -0.38 + state.pointer.y * 0.12, 3, delta);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, state.pointer.x * -0.1, 3, delta);
    if (core.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.025;
      core.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={tilt} position={offset}>
      <group ref={root} rotation={[-0.38, 0, 0]}>
        <mesh ref={core}>
          <sphereGeometry args={[0.62, 64, 64]} />
          <meshStandardMaterial color="#6a5ae0" emissive="#3b2c9c" emissiveIntensity={0.4} roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Atmosphere: a slightly larger back-face shell gives the planet a lit rim. */}
        <mesh scale={1.12}>
          <sphereGeometry args={[0.62, 48, 48]} />
          <meshBasicMaterial color={INDIGO} transparent opacity={0.22} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <Glow texture={texture} color={INDIGO} scale={4.2} opacity={0.55} />
        <Glow texture={texture} color={FLARE} scale={2.2} opacity={0.12} />
        {ORBITS.map((_, index) => (
          <Orbit key={index} index={index} texture={texture} animate={animate} />
        ))}
        <Satellite texture={texture} animate={animate} />
      </group>
    </group>
  );
}

/** Wide screens: push the system up and right so the sprint card overlaps its edge, not its core. */
function ResponsiveSystem({ triggerRef, animate }: { triggerRef: RefObject<HTMLElement | null>; animate: boolean }) {
  const { viewport } = useThree();
  const wide = viewport.aspect > 1.1;
  return <System triggerRef={triggerRef} animate={animate} offset={wide ? [1.7, 0.35, 0] : [0, -2.2, -2.5]} />;
}

export default function OrbitScene({
  triggerRef,
  animate,
  visible,
}: {
  triggerRef: RefObject<HTMLElement | null>;
  /** False when the visitor prefers reduced motion: render one still frame. */
  animate: boolean;
  /** Pauses rendering while the hero is scrolled out of view. */
  visible: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 10], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={animate ? (visible ? "always" : "never") : "demand"}
      aria-hidden="true"
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[-4, 3, 5]} intensity={2.2} color="#d9d3ff" />
      <pointLight position={[5, -2, -3]} intensity={14} color="#ff8a3d" />
      <Stars radius={70} depth={45} count={2600} factor={3.2} saturation={0} fade speed={animate ? 0.5 : 0} />
      <ResponsiveSystem triggerRef={triggerRef} animate={animate} />
    </Canvas>
  );
}
