import { SkeletonCard } from "@/src/components/SkeletonCard";

export default function VozyLoading() {
  return (
    <div className="container-page" style={{ padding: "80px 40px" }}>
      <div style={{ height: 18, width: 160, background: "var(--black-border)" }} className="animate-pulse" />
      <div style={{ marginTop: 12, height: 36, width: 280, background: "var(--black-border)" }} className="animate-pulse" />
      <div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        style={{ marginTop: 32 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
