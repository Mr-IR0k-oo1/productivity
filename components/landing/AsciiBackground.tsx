"use client";

export function AsciiBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(125%_95%_at_50%_-10%,#082457_0%,#031635_38%,#010a21_68%,#01040f_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,12,30,0.14)_0%,rgba(2,8,20,0.44)_52%,rgba(1,4,12,0.9)_100%)]" />

      <div className="star-far absolute inset-0 bg-[radial-gradient(circle,rgba(241,247,255,0.72)_0.48px,transparent_0.92px)] [background-size:250px_250px] opacity-34" />
      <div className="star-near absolute inset-0 bg-[radial-gradient(circle_at_15%_26%,rgba(255,255,255,0.94)_0.62px,transparent_1.04px),radial-gradient(circle_at_74%_70%,rgba(235,244,255,0.74)_0.58px,transparent_1.03px),radial-gradient(circle_at_48%_56%,rgba(201,221,249,0.66)_0.5px,transparent_0.95px)] [background-size:160px_160px,230px_230px,310px_310px] opacity-62" />

      <div className="event-horizon absolute right-[-16vw] bottom-[-26vh] h-[88vh] w-[88vh] rounded-full border border-sky-400/25 bg-[radial-gradient(circle_at_34%_40%,rgba(34,88,165,0.32)_0%,rgba(8,25,50,0.8)_48%,rgba(2,8,20,0.95)_72%,rgba(1,4,11,1)_100%)] shadow-[0_0_120px_rgba(36,89,179,0.35)]" />
      <div className="event-horizon-rim absolute right-[-18vw] bottom-[-28vh] h-[92vh] w-[92vh] rounded-full border border-sky-500/22 blur-[1px]" />

      <div className="orbit-line orbit-line-main absolute left-[19%] bottom-[9%] h-[27vh] w-[118vw] rounded-[100%] border border-sky-500/34" />
      <div className="orbit-line orbit-line-wide absolute left-[11%] bottom-[4%] h-[35vh] w-[132vw] rounded-[100%] border border-sky-500/22" />
      <div className="orbit-line orbit-line-inner absolute left-[24%] bottom-[14%] h-[20vh] w-[102vw] rounded-[100%] border border-sky-400/24" />
      <div className="orbit-glow absolute bottom-[16%] left-[42%] h-3 w-3 rounded-full bg-sky-200/95 shadow-[0_0_16px_rgba(124,196,255,0.96),0_0_48px_rgba(83,138,255,0.78)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_60%,transparent_36%,rgba(0,0,0,0.45)_100%)]" />

      <style jsx>{`
        @keyframes twinkleNear {
          0%,
          100% {
            opacity: 0.18;
            transform: translate3d(0, 0, 0);
          }
          50% {
            opacity: 0.35;
            transform: translate3d(-7px, -5px, 0);
          }
        }

        @keyframes driftFar {
          0%,
          100% {
            opacity: 0.2;
            transform: translate3d(0, 0, 0);
          }
          50% {
            opacity: 0.28;
            transform: translate3d(6px, 4px, 0);
          }
        }

        @keyframes orbitFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(-6deg);
          }
          50% {
            transform: translate3d(4px, -3px, 0) rotate(-5.4deg);
          }
        }

        .star-near {
          animation: twinkleNear 20s ease-in-out infinite;
        }

        .star-far {
          animation: driftFar 28s ease-in-out infinite;
        }

        .orbit-line {
          animation: orbitFloat 24s ease-in-out infinite;
          transform: rotate(-6deg);
        }

        .orbit-line-wide {
          animation-duration: 31s;
          animation-delay: -9s;
        }

        .orbit-line-inner {
          animation-duration: 20s;
          animation-delay: -5s;
        }

        @media (max-width: 640px) {
          .star-near {
            opacity: 0.18;
          }

          .star-far {
            opacity: 0.2;
          }

          .event-horizon {
            width: 58vh;
            height: 58vh;
            right: -34vw;
            bottom: -12vh;
          }

          .event-horizon-rim {
            width: 62vh;
            height: 62vh;
            right: -36vw;
            bottom: -14vh;
          }

          .orbit-line-main {
            width: 136vw;
            left: -8%;
          }

          .orbit-line-wide {
            width: 148vw;
            left: -12%;
          }

          .orbit-line-inner {
            width: 124vw;
            left: 2%;
          }

          .orbit-glow {
            left: 41%;
            bottom: 21%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .star-near,
          .star-far,
          .orbit-line {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
