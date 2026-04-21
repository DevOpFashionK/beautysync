// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ background: "#0F0A1E" }}
      className="min-h-screen w-full relative overflow-hidden"
    >
      {/* Orbe violet — top left */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(112,0,255,0.14) 0%, transparent 70%)",
        }}
      />

      {/* Orbe rose — bottom right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,45,85,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}