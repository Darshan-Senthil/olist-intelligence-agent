/** Ambient page backdrop - kept minimal so content carries the design. */
export function Background() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute -top-[28%] left-1/2 h-[min(85vh,900px)] w-[min(140vw,1600px)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(closest-side,rgb(0_0_0_/_0.04),transparent_70%)] dark:bg-[radial-gradient(closest-side,rgb(255_255_255_/_0.06),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,var(--background)_min(32rem,55vh))]" />
    </div>
  );
}
