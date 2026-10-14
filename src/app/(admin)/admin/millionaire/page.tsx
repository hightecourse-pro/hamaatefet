import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { KIND_LABEL } from "@/lib/events";
import { civilDateLabel } from "@/lib/hebrew";
import { ProposalRow } from "./proposal-row";

export const metadata = { title: "המיליונרית" };

export default async function AdminMillionairePage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: proposals } = await admin
    .from("hosting_proposals")
    .select("*, profiles(first_name, last_name, email, phone), events(id, title, event_date)")
    .order("created_at", { ascending: false })
    .limit(200);
  const list = proposals ?? [];
  return (
    <section style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700 }}>
          <span className="grad">המיליונרית – הצעות אירוח</span>
        </h1>
        <span className="hand" style={{ fontSize: 17, color: "#9A4318" }}>
          צ׳קים שממתינים לחתימה שלך
        </span>
      </div>
      <div style={{ overflowX: "auto", border: "1.5px solid #F3E6DD", borderRadius: 16 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>מציעה</th>
              <th>סוג</th>
              <th>שם המפגש</th>
              <th>מועד מועדף</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#6A4558", padding: 28 }}>
                  עוד לא נחתם אף צ׳ק.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <ProposalRow
                key={p.id}
                proposal={{
                  id: p.id,
                  kind: KIND_LABEL[p.kind] ?? p.kind,
                  title: p.title,
                  description: p.description,
                  needs: p.needs,
                  preferred_month: p.preferred_month,
                  status: p.status,
                  display_name: p.display_name,
                  created_at: civilDateLabel(p.created_at.slice(0, 10)),
                  proposer: `${p.profiles?.first_name ?? ""} ${p.profiles?.last_name ?? ""}`.trim(),
                  email: p.profiles?.email ?? "",
                  phone: p.profiles?.phone ?? "",
                }}
                scheduled={p.events ? <Link href={`/admin/events/${p.events.id}`}>{p.events.title} · {civilDateLabel(p.events.event_date)}</Link> : null}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
