export default function SluzbyLoading() {
  return (
    <div className="container-page" style={{ padding: "80px 40px" }}>
      <div className="animate-pulse" style={{ height: 18, width: 100, background: "var(--black-border)" }} />
      <div
        className="animate-pulse"
        style={{ marginTop: 12, height: 36, width: 280, background: "var(--black-border)" }}
      />
      <div style={{ marginTop: 32, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ height: 180, background: "var(--black-card)", border: "1px solid var(--black-border)" }}
          />
        ))}
      </div>
    </div>
  );
}
