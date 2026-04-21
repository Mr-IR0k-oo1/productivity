"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeSpaceLayer() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const root = document.documentElement;
    const getThemeColor = () => getComputedStyle(root).getPropertyValue('--foreground').trim() || '#f5f5f5';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mountNode.appendChild(renderer.domElement);

    const farStarGeometry = new THREE.BufferGeometry();
    const farStarCount = 620;
    const farStarPositions = new Float32Array(farStarCount * 3);

    for (let index = 0; index < farStarCount; index += 1) {
      const i = index * 3;
      farStarPositions[i] = (Math.random() - 0.5) * 30;
      farStarPositions[i + 1] = (Math.random() - 0.5) * 18;
      farStarPositions[i + 2] = (Math.random() - 0.5) * 22;
    }

    farStarGeometry.setAttribute("position", new THREE.BufferAttribute(farStarPositions, 3));

    const farStarMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(getThemeColor()),
      size: 0.028,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const farStars = new THREE.Points(farStarGeometry, farStarMaterial);
    farStars.position.z = -2.4;
    scene.add(farStars);

    const nearStarGeometry = new THREE.BufferGeometry();
    const nearStarCount = 360;
    const nearStarPositions = new Float32Array(nearStarCount * 3);

    for (let index = 0; index < nearStarCount; index += 1) {
      const i = index * 3;
      nearStarPositions[i] = (Math.random() - 0.5) * 24;
      nearStarPositions[i + 1] = (Math.random() - 0.5) * 14;
      nearStarPositions[i + 2] = (Math.random() - 0.5) * 16;
    }

    nearStarGeometry.setAttribute("position", new THREE.BufferAttribute(nearStarPositions, 3));

    const nearStarMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(getThemeColor()),
      size: 0.04,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const nearStars = new THREE.Points(nearStarGeometry, nearStarMaterial);
    nearStars.position.z = -1.2;
    scene.add(nearStars);

    const observer = new MutationObserver(() => {
      const color = getThemeColor();
      farStarMaterial.color.set(color);
      nearStarMaterial.color.set(color);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    const setSize = () => {
      const width = mountNode.clientWidth || window.innerWidth;
      const height = mountNode.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    setSize();

    let animationFrame = 0;
    const clock = new THREE.Clock();

    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        farStars.rotation.y = elapsed * 0.007;
        farStars.rotation.x = Math.sin(elapsed * 0.11) * 0.01;
        nearStars.rotation.y = -elapsed * 0.012;
        nearStars.rotation.x = Math.sin(elapsed * 0.16) * 0.015;
      }

      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      animationFrame = window.requestAnimationFrame(renderFrame);
    }

    window.addEventListener("resize", setSize);

    return () => {
      window.removeEventListener("resize", setSize);
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();

      farStarGeometry.dispose();
      farStarMaterial.dispose();
      nearStarGeometry.dispose();
      nearStarMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mountNode) {
        mountNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none absolute inset-0 z-[1] opacity-75" aria-hidden />;
}
