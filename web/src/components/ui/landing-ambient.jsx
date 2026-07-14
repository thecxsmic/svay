export function LandingAmbient() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute -top-[12%] left-[18%] h-[42vw] max-h-[520px] w-[42vw] max-w-[520px] rounded-full opacity-55 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.16), transparent 68%)",
          animation: "landing-drift-a 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[38%] -right-[8%] h-[36vw] max-h-[440px] w-[36vw] max-w-[440px] rounded-full opacity-55 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)",
          animation: "landing-drift-b 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[4%] left-[28%] h-[30vw] max-h-[360px] w-[48vw] max-w-[560px] rounded-full opacity-55 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(147,197,253,0.08), transparent 72%)",
          animation: "landing-drift-c 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -10%, transparent 40%, rgba(3,3,8,0.85) 100%), linear-gradient(to bottom, transparent 0%, rgba(3,3,8,0.4) 55%, #030308 100%)",
        }}
      />
    </div>
  );
}
