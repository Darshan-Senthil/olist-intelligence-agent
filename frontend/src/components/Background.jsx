import { motion, useReducedMotion } from "framer-motion";

const UNICORN_EMBED = import.meta.env.VITE_UNICORN_EMBED_URL?.trim();

/**
 * Light, warm backdrop (no heavy dark slabs). Optional Unicorn embed unchanged.
 */
export function Background() {
  const reduce = useReducedMotion();

  if (UNICORN_EMBED) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <iframe
          title="Background"
          src={UNICORN_EMBED}
          className="h-full w-full border-0 opacity-90"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-stone-100/85 dark:bg-stone-950/80" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -inset-[40%] opacity-90 dark:opacity-55"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 12% 18%, oklch(0.94 0.04 85 / 0.9), transparent 55%), radial-gradient(ellipse 60% 45% at 88% 12%, oklch(0.93 0.035 95 / 0.85), transparent 50%), radial-gradient(ellipse 50% 55% at 50% 95%, oklch(0.92 0.02 75 / 0.5), transparent 52%)",
        }}
        animate={
          reduce
            ? {}
            : {
                x: [0, 14, -10, 0],
                y: [0, -12, 8, 0],
                scale: [1, 1.02, 1.01, 1],
              }
        }
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,oklch(0.99_0.005_85)_0%,oklch(0.985_0.008_80)_40%,oklch(0.97_0.01_75)_100%)] dark:bg-[linear-gradient(180deg,oklch(0.13_0.01_255)_0%,oklch(0.15_0.015_255)_45%,oklch(0.11_0.01_250)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-5%,oklch(1_0_0_/_0.65),transparent_60%)] dark:bg-[radial-gradient(ellipse_85%_55%_at_50%_-5%,oklch(1_0_0_/_0.08),transparent_65%)]" />
    </div>
  );
}
