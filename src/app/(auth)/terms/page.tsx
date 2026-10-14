import Link from "next/link";
import { getContent } from "@/lib/content";
import { RichHtml } from "@/components/rich-html";
import { sanitizeRich } from "@/lib/rich-text";

export const metadata = { title: "תקנון ומדיניות פרטיות" };

export default async function TermsPage() {
  const c = await getContent();
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#FFF8F2" }}>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 72px" }}>
        <section style={{ background: "#fff", border: "2px solid #F0E2D8", borderRadius: 28, padding: "32px 30px", boxShadow: "8px 8px 0 #F3DCCB" }}>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>
            <span className="grad">{c.get("terms.title")}</span>
          </h1>
          <p className="hand" style={{ margin: "6px 0 18px", fontSize: 18, color: "#7A5566" }}>
            {c.get("general.footer")}
          </p>
          <RichHtml html={sanitizeRich(c.get("terms.body"))} className="rich-doc" />
          <p style={{ margin: "18px 0 0" }}>
            <Link href="/login">חזרה לכניסה</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
