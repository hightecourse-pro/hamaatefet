"use client";

import { useActionState, useRef } from "react";
import { addAd, type AdminState } from "../actions";

const LABEL = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, fontWeight: 600 } as const;

/** Upload one advertisement: name, image, optional link, shown-now switch. */
export function AdForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<AdminState, FormData>(
    async (prev, fd) => {
      const r = await addAd(prev, fd);
      if (!r.error) formRef.current?.reset();
      return r;
    },
    { error: null }
  );
  return (
    <form ref={formRef} action={action} style={{ display: "flex", flexDirection: "column", gap: 10, background: "#FBF1EA", borderRadius: 16, padding: 14 }}>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>העלאת פרסומת</h2>
      {state.error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
          {state.ok}
        </p>
      )}
      <label style={LABEL}>
        שם (לזיהוי בניהול; גם הטקסט החלופי לקוראי מסך)
        <input className="fld fld-sm" name="name" required maxLength={80} placeholder="למשל: סטודיו לציור – מבצע חורף" />
      </label>
      <label style={LABEL}>
        התמונה (300 פיקסלים רוחב, עד 2MB)
        <input className="fld fld-sm" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required style={{ padding: 8 }} />
      </label>
      <label style={LABEL}>
        קישור (לאן הלחיצה מובילה; ריק = תמונה בלי קישור)
        <input className="fld fld-sm" name="link_url" type="url" dir="ltr" placeholder="https://" maxLength={500} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, cursor: "pointer" }}>
        <input type="checkbox" name="active" defaultChecked style={{ width: 18, height: 18, accentColor: "#6E0F1A" }} />
        מוצגת לחברות מיד
      </label>
      <div>
        <button type="submit" className="btn-sm-green" disabled={pending}>
          {pending ? "מעלה…" : "העלאה"}
        </button>
      </div>
    </form>
  );
}
