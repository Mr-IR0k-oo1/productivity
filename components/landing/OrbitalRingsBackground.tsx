"use client";

import React, { useEffect, useRef } from "react";

export function OrbitalRingsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;

    let W: number, H: number, PX: number, PY: number, PR: number, stars: any[], RINGS: any[];

    function init() {
      if (!cv) return;
      cv.width = cv.parentElement?.offsetWidth || window.innerWidth;
      cv.height = cv.parentElement?.offsetHeight || window.innerHeight;
      W = cv.width;
      H = cv.height;
      PX = W * 0.72;
      PY = H * 0.79;
      PR = H * 0.305;

      stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.pow(Math.random(), 2.8) * 2.4 + 0.28,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 1.3 + 0.28,
        mx: Math.random() * 0.55 + 0.3,
      }));

      RINGS = [
        { rx: PR * 1.56, ry: PR * 0.275, zo: 0.0, rgb: [80, 168, 255], a: 0.6, w: 1.35, p: 0.000082 },
        { rx: PR * 2.04, ry: PR * 0.365, zo: 0.2, rgb: [56, 136, 226], a: 0.38, w: 0.82, p: 0.00005 },
        { rx: PR * 2.52, ry: PR * 0.455, zo: -0.14, rgb: [36, 106, 190], a: 0.22, w: 0.56, p: 0.00003 },
      ];
    }

    init();
    window.addEventListener("resize", init);

    function drawBg() {
      cx!.fillStyle = "#030912";
      cx!.fillRect(0, 0, W, H);
    }

    function drawNebula() {
      [
        [W * 0.12, H * 0.2, 230, [55, 0, 122], 0.072],
        [W * 0.88, H * 0.08, 185, [0, 44, 138], 0.062],
        [W * 0.48, H * 0.68, 218, [32, 0, 90], 0.058],
      ].forEach(([x, y, r, c, a]: any) => {
        const g = cx!.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${c},${a})`);
        g.addColorStop(1, `rgba(${c},0)`);
        cx!.beginPath();
        cx!.arc(x, y, r, 0, Math.PI * 2);
        cx!.fillStyle = g;
        cx!.fill();
      });
    }

    function drawStars(t: number) {
      stars.forEach((s) => {
        const v = (Math.sin(t * s.sp + s.ph) * 0.5 + 0.5) * s.mx + (1 - s.mx);
        cx!.beginPath();
        cx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        cx!.fillStyle = `rgba(255,255,255,${Math.min(0.9, v * 0.85)})`;
        cx!.fill();
      });
    }

    function drawArc(r: any, t: number, sa: number, ea: number, back: boolean) {
      const zr = r.zo + t * r.p;
      cx!.save();
      cx!.translate(PX, PY);
      cx!.rotate(zr);
      cx!.beginPath();
      cx!.ellipse(0, 0, r.rx, r.ry, 0, sa, ea);
      cx!.strokeStyle = `rgba(${r.rgb},${back ? r.a * 0.52 : r.a})`;
      cx!.lineWidth = back ? r.w * 0.7 : r.w;
      cx!.stroke();
      cx!.restore();
    }

    function drawRingShimmer(r: any, t: number) {
      const zr = r.zo + t * r.p;
      const pulseA = (Math.sin(t * 0.4) * 0.5 + 0.5) * 0.18 + 0.04;
      cx!.save();
      cx!.translate(PX, PY);
      cx!.rotate(zr);
      cx!.beginPath();
      cx!.ellipse(0, 0, r.rx, r.ry, 0, 0, Math.PI * 2);
      cx!.strokeStyle = `rgba(${r.rgb},${pulseA})`;
      cx!.lineWidth = r.w * 2.8;
      cx!.stroke();
      cx!.restore();
    }

    function drawPlanet() {
      let g;

      // Outer halo
      g = cx!.createRadialGradient(PX, PY, PR * 0.88, PX, PY, PR * 1.68);
      g.addColorStop(0, "rgba(14,68,188,0)");
      g.addColorStop(0.44, "rgba(14,68,188,0.10)");
      g.addColorStop(1, "rgba(4,22,82,0)");
      cx!.beginPath();
      cx!.arc(PX, PY, PR * 1.68, 0, Math.PI * 2);
      cx!.fillStyle = g;
      cx!.fill();

      // Body gradient
      g = cx!.createRadialGradient(PX - PR * 0.28, PY - PR * 0.28, PR * 0.04, PX + PR * 0.1, PY + PR * 0.1, PR);
      g.addColorStop(0, "#102e52");
      g.addColorStop(0.36, "#071830");
      g.addColorStop(0.72, "#040d1e");
      g.addColorStop(1, "#020810");
      cx!.beginPath();
      cx!.arc(PX, PY, PR, 0, Math.PI * 2);
      cx!.fillStyle = g;
      cx!.fill();

      // Surface details (clipped)
      cx!.save();
      cx!.beginPath();
      cx!.arc(PX, PY, PR, 0, Math.PI * 2);
      cx!.clip();
      cx!.fillStyle = "rgba(10,40,100,0.08)";
      cx!.fillRect(PX - PR, PY - PR * 0.26, PR * 2, PR * 0.17);
      cx!.fillStyle = "rgba(7,28,68,0.06)";
      cx!.fillRect(PX - PR, PY + PR * 0.07, PR * 2, PR * 0.12);

      // Rim light (backlit highlight)
      g = cx!.createRadialGradient(PX, PY, PR * 0.72, PX, PY, PR);
      g.addColorStop(0, "rgba(38,116,255,0)");
      g.addColorStop(0.74, "rgba(38,116,255,0)");
      g.addColorStop(0.87, "rgba(38,116,255,0.10)");
      g.addColorStop(1, "rgba(38,116,255,0.24)");
      cx!.beginPath();
      cx!.arc(PX, PY, PR, 0, Math.PI * 2);
      cx!.fillStyle = g;
      cx!.fill();

      // Polar shimmer
      g = cx!.createRadialGradient(PX - PR * 0.18, PY - PR * 0.75, 0, PX - PR * 0.18, PY - PR * 0.75, PR * 0.42);
      g.addColorStop(0, "rgba(80,160,255,0.07)");
      g.addColorStop(1, "rgba(80,160,255,0)");
      cx!.beginPath();
      cx!.arc(PX, PY, PR, 0, Math.PI * 2);
      cx!.fillStyle = g;
      cx!.fill();
      cx!.restore();

      // Atmospheric rim stroke
      g = cx!.createRadialGradient(PX, PY, PR * 0.86, PX, PY, PR * 1.1);
      g.addColorStop(0, "rgba(34,110,242,0)");
      g.addColorStop(0.54, "rgba(34,110,242,0.19)");
      g.addColorStop(1, "rgba(34,110,242,0)");
      cx!.beginPath();
      cx!.arc(PX, PY, PR * 1.04, 0, Math.PI * 2);
      cx!.strokeStyle = g;
      cx!.lineWidth = PR * 0.22;
      cx!.stroke();
    }

    function drawSatellite(t: number) {
      const r = RINGS[0];
      const ang = t * 0.268;
      const zr = r.zo + t * r.p;
      const lx = r.rx * Math.cos(ang),
        ly = r.ry * Math.sin(ang);
      const wx = PX + lx * Math.cos(zr) - ly * Math.sin(zr);
      const wy = PY + lx * Math.sin(zr) + ly * Math.cos(zr);
      if (ly < 0 && Math.hypot(wx - PX, wy - PY) < PR) return;

      const g = cx!.createRadialGradient(wx, wy, 0, wx, wy, 14);
      g.addColorStop(0, "rgba(158,228,255,0.60)");
      g.addColorStop(1, "rgba(78,158,255,0)");
      cx!.beginPath();
      cx!.arc(wx, wy, 14, 0, Math.PI * 2);
      cx!.fillStyle = g;
      cx!.fill();
      cx!.beginPath();
      cx!.arc(wx, wy, 2.3, 0, Math.PI * 2);
      cx!.fillStyle = "rgba(210,242,255,0.95)";
      cx!.fill();
    }

    let rafId: number;
    function draw(ts: number) {
      const t = ts * 0.001;
      cx!.clearRect(0, 0, W, H);
      drawBg();
      drawNebula();
      drawStars(t);
      RINGS.forEach((r) => {
        drawRingShimmer(r, t);
        drawArc(r, t, Math.PI, Math.PI * 2, true);
      });
      drawPlanet();
      RINGS.forEach((r) => drawArc(r, t, 0, Math.PI, false));
      drawSatellite(t);
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 65% 75% at 26% 52%, transparent 42%, rgba(2,8,17,0.62) 100%)",
        }}
      />
    </div>
  );
}
