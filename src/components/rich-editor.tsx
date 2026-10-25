"use client";

import { useRef, useState } from "react";

const EMOJI = ["😊", "😂", "🥰", "😍", "🤗", "😉", "😎", "🤩", "🥳", "😅", "🙏", "👏", "💪", "🙌", "👍", "❤️", "💜", "💛", "🧡", "💖", "✨", "🌸", "🌷", "🌼", "☀️", "🌈", "🎉", "🎂", "🎈", "🎁", "🕯️", "☕", "🍰", "🍫", "🎶", "📚", "✏️", "💡", "🔥", "⭐", "💌", "✉️", "🌙", "😢", "🤔", "😴", "💬", "🫶"];

const BTN = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1.5px solid #EAD3C6",
  background: "#fff",
  color: "#6E0F1A",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
  fontWeight: 700,
} as const;

export interface EditorLabels {
  bold: string;
  italic: string;
  underline: string;
  list: string;
  link: string;
  linkPrompt: string;
  emoji: string;
  emojiPicker: string;
}

const DEFAULT_LABELS: EditorLabels = { bold: "מודגש", italic: "נטוי", underline: "קו תחתון", list: "רשימה", link: "קישור", linkPrompt: "כתובת הקישור (https://…)", emoji: "אימוג׳י", emojiPicker: "בחירת אימוג׳י" };

/**
 * A small rich-text box (bold, italic, underline, lists, link, emoji) that
 * submits HTML through a hidden input. The server sanitizes before storing.
 * To clear it after a submit, remount it (key=).
 */
export function RichEditor({
  name,
  placeholder,
  minHeight = 120,
  compact = false,
  initialHtml = "",
  labels,
}: {
  name: string;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
  initialHtml?: string;
  /** Tool names (editable as editor.* in «תוכן האתר»); the admin screens use the defaults. */
  labels?: Partial<EditorLabels>;
}) {
  const L: EditorLabels = { ...DEFAULT_LABELS, ...labels };
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialHtml);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [empty, setEmpty] = useState(!initialHtml);

  function sync() {
    const el = ref.current;
    if (!el) return;
    setHtml(el.innerHTML);
    setEmpty(el.textContent?.trim() === "" && !el.querySelector("li"));
  }

  function cmd(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function insertEmoji(e: string) {
    ref.current?.focus();
    document.execCommand("insertText", false, e);
    setEmojiOpen(false);
    sync();
  }

  function addLink() {
    const url = window.prompt(L.linkPrompt);
    if (!url) return;
    const safe = /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
    cmd("createLink", safe);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
      <input type="hidden" name={name} value={html} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button type="button" style={BTN} title={L.bold} aria-label={L.bold} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("bold")}>
          B
        </button>
        <button type="button" style={{ ...BTN, fontStyle: "italic", fontWeight: 500 }} title={L.italic} aria-label={L.italic} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("italic")}>
          I
        </button>
        <button type="button" style={{ ...BTN, textDecoration: "underline", fontWeight: 500 }} title={L.underline} aria-label={L.underline} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("underline")}>
          U
        </button>
        {!compact && (
          <>
            <button type="button" style={BTN} title={L.list} aria-label={L.list} onMouseDown={(e) => e.preventDefault()} onClick={() => cmd("insertUnorderedList")}>
              ≡
            </button>
            <button type="button" style={BTN} title={L.link} aria-label={L.link} onMouseDown={(e) => e.preventDefault()} onClick={addLink}>
              🔗
            </button>
          </>
        )}
        <button type="button" style={BTN} title={L.emoji} aria-label={L.emoji} aria-expanded={emojiOpen} onMouseDown={(e) => e.preventDefault()} onClick={() => setEmojiOpen((v) => !v)}>
          😊
        </button>
      </div>
      {emojiOpen && (
        <div role="dialog" aria-label={L.emojiPicker} style={{ position: "absolute", top: 42, right: 0, zIndex: 5, background: "#fff", border: "2px solid #EAD3C6", borderRadius: 16, padding: 10, display: "grid", gridTemplateColumns: "repeat(8, 34px)", gap: 4, boxShadow: "4px 4px 0 #EBD4C8" }}>
          {EMOJI.map((e) => (
            <button key={e} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => insertEmoji(e)} style={{ width: 34, height: 34, border: "none", background: "transparent", fontSize: 22, cursor: "pointer", borderRadius: 8 }}>
              {e}
            </button>
          ))}
        </div>
      )}
      <div style={{ position: "relative" }}>
        {empty && placeholder && (
          <span aria-hidden="true" style={{ position: "absolute", top: 12, right: 16, color: "#9A8590", fontSize: 17, pointerEvents: "none" }}>
            {placeholder}
          </span>
        )}
        <div
          ref={(el) => {
            ref.current = el;
            if (el && el.dataset.init !== "1") {
              el.innerHTML = initialHtml;
              el.dataset.init = "1";
            }
          }}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          data-rich-editor={name}
          onInput={sync}
          onBlur={sync}
          className="fld rich"
          style={{ minHeight, height: "auto", padding: "12px 16px", lineHeight: 1.6, overflow: "auto" }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
