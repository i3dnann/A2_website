export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050608]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(55,216,255,.09),transparent_25rem),radial-gradient(circle_at_84%_32%,rgba(124,92,255,.14),transparent_32rem)]" />
      <div className="neo-grid absolute inset-0 opacity-40" />
      <div className="neo-orbit absolute -right-[18rem] top-[8%] h-[42rem] w-[42rem] rounded-full border border-[var(--site-primary)]/15" />
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-[#050608] to-transparent" />
    </div>
  );
}
