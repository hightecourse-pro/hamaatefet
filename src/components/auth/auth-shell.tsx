import Image from "next/image";

/** The login card's frame, for the small flows (new password, welcome, pending). */
export function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2", color: "#3A1530", position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", top: 80, left: "46%", width: 18, height: 18, borderRadius: "50%", background: "#F0A35E" }} />
      <div aria-hidden="true" style={{ position: "absolute", top: 220, left: "8%", width: 12, height: 12, borderRadius: "50%", background: "#A3304A" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: 90, left: "40%", width: 26, height: 26, borderRadius: "50%", border: "4px solid #F6C9A6" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: 160, right: "4%", width: 14, height: 14, borderRadius: 4, background: "#4A1942", transform: "rotate(20deg)" }} />
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "48px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <section
          style={{
            flex: `1 1 ${wide ? 560 : 440}px`,
            maxWidth: wide ? 640 : 480,
            background: "#FFFFFF",
            borderRadius: 32,
            padding: "40px 36px",
            boxShadow: "10px 10px 0 #F3DCCB",
            border: "2px solid #F0E2D8",
            position: "relative",
          }}
        >
          <Image src="/brand/seal.png" alt="" width={92} height={92} style={{ position: "absolute", top: -34, left: -26, width: 92, height: 92, transform: "rotate(-14deg)" }} />
          <Image src="/brand/logo.png" alt="המעטפת – מבית חד או פאן" width={220} height={93} priority style={{ width: 220, height: "auto", display: "block", margin: "0 auto 24px" }} />
          {children}
        </section>
      </div>
    </div>
  );
}
