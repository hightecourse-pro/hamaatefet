"use client";

import { useActionState, useState } from "react";
import { scheduleProposal, setProposalStatus, type AdminState } from "../actions";
import { ActionButton } from "../ui";

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "חדשה", cls: "pill pill-pending" },
  scheduled: { label: "נקבע מועד", cls: "pill pill-active" },
  declined: { label: "נדחתה", cls: "pill pill-paused" },
};

const LABEL = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 500, flex: "1 1 160px" } as const;

export function ProposalRow({
  proposal,
  scheduled,
}: {
  proposal: { id: string; kind: string; title: string; description: string; needs: string; preferred_month: string; status: string; display_name: string; created_at: string; proposer: string; email: string; phone: string };
  scheduled: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminState, FormData>(scheduleProposal.bind(null, proposal.id), { error: null });
  const st = STATUS[proposal.status] ?? STATUS.new;
  return (
    <>
      <tr>
        <td>
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 500 }}>{proposal.display_name || proposal.proposer}</span>
            <span dir="ltr" style={{ fontSize: 13, color: "#6A4558", textAlign: "right" }}>
              {proposal.email}
              {proposal.phone ? ` · ${proposal.phone}` : ""}
            </span>
          </span>
        </td>
        <td>{proposal.kind}</td>
        <td>
          <button type="button" className="btn-link" style={{ textDecoration: "none", fontWeight: 600, padding: 0 }} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {proposal.title}
          </button>
        </td>
        <td>{proposal.preferred_month || "גמיש"}</td>
        <td>
          <span className={st.cls}>{st.label}</span>
        </td>
        <td>
          <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {proposal.status === "new" && (
              <button type="button" className="btn-sm-rust" onClick={() => setOpen(true)}>
                קביעת מועד
              </button>
            )}
            {proposal.status === "new" && (
              <ActionButton className="btn-sm" confirm="לדחות את ההצעה?" action={setProposalStatus.bind(null, proposal.id, "declined")}>
                דחייה
              </ActionButton>
            )}
            {proposal.status === "declined" && (
              <ActionButton className="btn-sm" action={setProposalStatus.bind(null, proposal.id, "new")}>
                החזרה לחדשות
              </ActionButton>
            )}
            {scheduled}
          </span>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} style={{ whiteSpace: "normal", background: "#FFFCFA" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "6px 0" }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#5A3348", whiteSpace: "pre-wrap" }}>
                <b>על מה נטעם:</b> {proposal.description}
                {proposal.needs && (
                  <>
                    <br />
                    <b>צריכה:</b> {proposal.needs}
                  </>
                )}
                <br />
                <span style={{ color: "#7A5566" }}>נחתם {proposal.created_at}</span>
              </p>
              {proposal.status === "new" && (
                <form action={action} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                  <label style={{ ...LABEL, flex: "2 1 220px" }}>
                    שם המפגש
                    <input className="fld fld-sm" name="title" defaultValue={proposal.title} />
                  </label>
                  <label style={LABEL}>
                    תאריך
                    <input className="fld fld-sm" name="event_date" type="date" dir="ltr" required />
                  </label>
                  <label style={{ ...LABEL, flex: "1 1 110px" }}>
                    משעה
                    <input className="fld fld-sm" name="start_time" type="time" dir="ltr" />
                  </label>
                  <label style={{ ...LABEL, flex: "1 1 110px" }}>
                    עד
                    <input className="fld fld-sm" name="end_time" type="time" dir="ltr" />
                  </label>
                  <label style={{ ...LABEL, flex: "2 1 220px" }}>
                    מקום
                    <input className="fld fld-sm" name="location" />
                  </label>
                  <label style={{ ...LABEL, flex: "1 1 110px" }}>
                    מקומות
                    <input className="fld fld-sm" name="capacity" type="number" min={1} dir="ltr" />
                  </label>
                  <label style={{ ...LABEL, flex: "1 1 110px" }}>
                    מחיר ₪
                    <input className="fld fld-sm" name="price_ils" type="number" min={0} defaultValue={0} dir="ltr" />
                  </label>
                  <button type="submit" className="btn-sm-rust" disabled={pending} style={{ height: 46 }}>
                    {pending ? "…" : "קביעה ופרסום"}
                  </button>
                  {state.error && (
                    <span role="alert" style={{ fontSize: 14, color: "#A3304A" }}>
                      {state.error}
                    </span>
                  )}
                  {state.ok && (
                    <span role="status" style={{ fontSize: 14, color: "#2F6B3A" }}>
                      {state.ok}
                    </span>
                  )}
                </form>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
