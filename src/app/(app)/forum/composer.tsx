"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, type ForumState } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { RichEditor } from "@/components/rich-editor";
import { tx, type Copy } from "@/lib/copy";

const LABEL = { display: "flex", flexDirection: "column", gap: 6, fontSize: 15, fontWeight: 500 } as const;

export interface ComposerLock {
  key: string;
  name: string;
  description: string;
  rulesTitle: string;
  rules: string[];
  /** Help section: "asking" = «מבקשת» only (members), "both" = the choice (the team). */
  helpKind?: "asking" | "offering" | "both";
}

/** What the section is for: its description and house rules, shown inside the form. */
export function SectionInfo({ description, rulesTitle, rules }: { description: string; rulesTitle: string; rules: string[] }) {
  if (!description && rules.length === 0) return null;
  return (
    <div data-testid="composer-section-info" style={{ background: "#FFFFFF", border: "1.5px dashed #E2C8BB", borderRadius: 14, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4, fontSize: 15, lineHeight: 1.5, color: "#5A3348" }}>
      {description && <b style={{ color: "#3A1530" }}>{description}</b>}
      {rules.length > 0 && (
        <span className="hand" style={{ fontSize: 17, color: "#A3304A" }}>
          {rulesTitle}
        </span>
      )}
      {rules.map((line, i) => (
        <span key={i}>{line}</span>
      ))}
    </div>
  );
}

/**
 * "Open a discussion" – rich text, emoji, an optional image. `sections` are the
 * ones this member may post in (the team: all; a member: the "members" ones).
 * With `lock` the form belongs to one section: no section picker (the help
 * section still asks "מבקשת / מציעה"), and the section's description + house
 * rules are shown at the top. On success she lands on the new thread.
 */
export function Composer({ sections, preselect, lock, userId, copy, onCancel }: { sections: { key: string; name: string }[]; preselect?: string; lock?: ComposerLock; userId: string; copy: Copy; onCancel?: () => void }) {
  const t = (k: string, vars?: Record<string, string>) => tx(copy, k, vars);
  const editorLabels = { bold: copy["editor.bold"], italic: copy["editor.italic"], underline: copy["editor.underline"], list: copy["editor.list"], link: copy["editor.link"], linkPrompt: copy["editor.link_prompt"], emoji: copy["editor.emoji"], emojiPicker: copy["editor.emoji_picker"] };
  const router = useRouter();
  const [imagePath, setImagePath] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<ForumState, FormData>(async (prev, fd) => {
    const r = await createPost(prev, fd);
    if (r.ok && r.postId) router.push(`/forum/${r.postId}`);
    return r;
  }, { error: null });

  async function onFile(file: File | undefined) {
    setUploadError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setUploadError(t("forum.err.image_big"));
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("forum-images").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setUploadError(t("forum.err.image_upload"));
    setImagePath(path);
    setImageName(file.name);
  }

  const options = sections.flatMap((s) =>
    s.key === "help"
      ? [
          { value: "help:asking", label: t("forum.composer.help_asking", { מדור: s.name }) },
          { value: "help:offering", label: t("forum.composer.help_offering", { מדור: s.name }) },
        ]
      : [{ value: s.key, label: s.name }]
  );
  const visibleOptions = lock ? options.filter((o) => (o.value === lock.key || o.value.startsWith(`${lock.key}:`)) && (!lock.helpKind || lock.helpKind === "both" || !o.value.includes(":") || o.value.endsWith(`:${lock.helpKind}`))) : options;
  const initial = visibleOptions.find((o) => o.value === preselect || o.value.startsWith(`${preselect}:`))?.value ?? visibleOptions[0]?.value;

  return (
    <section id="composer" style={{ background: "#FBF1EA", border: "2px solid #EAD3C6", borderRadius: 22, padding: 20, display: "flex", flexDirection: "column", gap: 12, boxShadow: "6px 6px 0 #4A1942" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700 }}>{lock ? t("forum.composer.title_in", { מדור: lock.name }) : t("forum.composer.title")}</h2>
        {onCancel && (
          <button type="button" className="btn-link" onClick={onCancel} style={{ fontSize: 14 }}>
            {t("forum.composer.cancel")}
          </button>
        )}
      </div>
      {lock && <SectionInfo description={lock.description} rulesTitle={lock.rulesTitle} rules={lock.rules} />}
      {state.ok && (
        <p role="status" className="flash flash-ok" style={{ margin: 0 }}>
          {t("forum.composer.published")}
        </p>
      )}
      {state.error && (
        <p role="alert" className="flash flash-err" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="hidden" name="image_path" value={imagePath} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {lock && visibleOptions.length <= 1 ? (
            <input type="hidden" name="section" value={visibleOptions[0]?.value ?? lock.key} />
          ) : lock ? (
            <fieldset style={{ border: "none", padding: 0, margin: 0, flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 6 }}>
              <legend style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, padding: 0 }}>{t("forum.composer.section")}</legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                {visibleOptions.map((o) => (
                  <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, cursor: "pointer" }}>
                    <input type="radio" name="section" value={o.value} defaultChecked={o.value === initial} style={{ width: 18, height: 18, accentColor: "#6E0F1A" }} />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <label style={{ ...LABEL, flex: "1 1 200px" }}>
              {t("forum.composer.section")}
              <select className="fld" name="section" style={{ height: 50, padding: "0 14px" }} defaultValue={initial}>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label style={{ ...LABEL, flex: "2 1 260px" }}>
            {t("forum.composer.post_title")}
            <input className="fld" name="title" type="text" placeholder={t("forum.composer.post_title_placeholder")} maxLength={140} required style={{ height: 50 }} />
          </label>
        </div>
        <div style={{ ...LABEL }}>
          {t("forum.composer.body")}
          <RichEditor name="body" placeholder={t("forum.composer.body_placeholder")} minHeight={120} labels={editorLabels} />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onFile(e.target.files?.[0])} />
          <button
            type="button"
            aria-label={t("forum.composer.image")}
            title={imageName || t("forum.composer.image")}
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
          <button type="submit" className="btn-primary" disabled={pending || uploading} style={{ height: 48, padding: "0 24px" }}>
            {pending ? t("forum.composer.busy") : uploading ? t("forum.composer.uploading") : t("forum.composer.button")}
          </button>
          {imageName && <span style={{ fontSize: 13, color: "#2F6B3A" }}>{t("forum.composer.attached", { קובץ: imageName })}</span>}
        </div>
        {uploadError && (
          <span role="alert" style={{ fontSize: 14, color: "#A3304A" }}>
            {uploadError}
          </span>
        )}
      </form>
    </section>
  );
}
