"use client";

import { useMemo } from "react";

interface Star {
  x: number;
  y: number;
  char: string;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

function generateStars(count: number): Star[] {
  const chars = ["·", "•", "°", "*", "+", "◦", "○", "✦", "✧", "｡", "･"];
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    char: chars[Math.floor(Math.random() * chars.length)],
    size: Math.random() * 0.5 + 0.5,
    opacity: Math.random() * 0.6 + 0.2,
    twinkleSpeed: Math.random() * 2 + 1,
  }));
}

export function AsciiBackground() {
  const stars = useMemo(() => generateStars(80), []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <pre className="absolute inset-0 font-mono text-[10px] leading-[1.1] text-zinc-500/40">
        {Array.from({ length: 50 }, (_, y) =>
          Array.from({ length: 100 }, (_, x) => {
            const star = stars.find(
              (s) => Math.abs(s.x - x) < 2 && Math.abs(s.y - y * 2) < 2
            );
            return star ? (
              <span
                key={`${x}-${y}`}
                style={{
                  opacity: star.opacity,
                  fontSize: `${star.size * 0.8}em`,
                  animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite`,
                }}
              >
                {star.char}
              </span>
            ) : (
              " "
            );
          }).join("")
        ).join("\n")}
      </pre>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, #fff 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, #fff 0.5px, transparent 0.5px)
          `,
          backgroundSize: "200px 200px, 300px 300px, 100px 100px",
        }}
      />

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
