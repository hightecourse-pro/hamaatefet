"use client";

import { useActionState, useRef, useState } from "react";
import { createPost, type ForumState } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { RichEditor } from "@/components/rich-editor";

const LABEL = { display: "flex", flexDirection: "column", gap: 6, fontSize: 15, fontWeight: 500 } as const;

/** The team's "open a discussion" box – rich text, emoji, an optional image. */
export function Composer({ sections, userId, title, button }: { sections: { key: string; name: string }[]; userId: string; title: string; button: string }) {
  const [imagePath, setImagePath] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ForumState, FormData>(async (prev, fd) => {
    const r = await createPost(prev, fd);
    if (r.ok) {
      formRef.current?.reset();
      setImagePath("");
      setImageName("");
      setResetKey((k) => k + 1);
    }
    return r;
  }, { error: null });

  async function onFile(file: File | undefined) {
    setUploadError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setUploadError("התמונה גדולה מדי (עד 5MB).");
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("forum-images").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setUploadError("לא הצלחנו להעלות את התמונה.");
    setImagePath(path);
    setImageName(file.name);
  }

  const options = sections.flatMap((s) =>
    s.key === "help"
      ? [
          { value: "help:asking", label: `${s.name} – מבקשת` },
          { value: "help:offering", label: `${s.name} – מציעה` },
        ]
      : [{ value: s.key, label: s.name }]
  );
  options.sort((a, b) => (a.value === "talk" ? -1 : b.value === "talk" ? 1 : 0));

  return (
    <section id="composer" style={{ background: "#FBF1EA", border: "2px solid #EAD3C6", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12, boxShadow: "6px 6px 0 #4A1942", transform: "rotate(1deg)" }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h2>
      {state.ok && (
        <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
          פורסם! הדיון כבר בפורום.
        </p>
      )}
      {state.error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <form ref={formRef} action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="hidden" name="image_path" value={imagePath} />
        <label style={LABEL}>
          מדור
          <select className="fld" name="section" style={{ height: 50, padding: "0 14px" }} defaultValue={options[0]?.value}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={LABEL}>
          כותרת
          <input className="fld" name="title" type="text" placeholder="משפט אחד שמסקרן" maxLength={140} required />
        </label>
        <div style={{ ...LABEL }}>
          מה בלב
          <RichEditor key={resetKey} name="body" placeholder="כתבי כאן…" minHeight={130} />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onFile(e.target.files?.[0])} />
          <button
            type="button"
            aria-label="צירוף תמונה"
            title={imageName || "צירוף תמונה"}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ width: 48, height: 48, borderRadius: 14, border: `2px ${imagePath ? "solid #2F6B3A" : "dashed #C9A3B0"}`, background: "#FFFFFF", color: imagePath ? "#2F6B3A" : "#6E0F1A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <button type="submit" className="btn-primary" disabled={pending || uploading} style={{ flex: 1, height: 50, padding: 0 }}>
            {pending ? "שולחת…" : uploading ? "מעלה תמונה…" : button}
          </button>
        </div>
        {imageName && <span style={{ fontSize: 13, color: "#2F6B3A" }}>צורפה: {imageName}</span>}
        {uploadError && (
          <span role="alert" style={{ fontSize: 14, color: "#A3304A" }}>
            {uploadError}
          </span>
        )}
      </form>
    </section>
  );
}
