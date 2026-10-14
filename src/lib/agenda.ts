export interface AgendaInput {
  time_label: string;
  title: string;
  body: string;
  questions: string[];
  sort_order: number;
}

/**
 * The admin writes the agenda as plain text: blocks separated by a blank line.
 * First line "HH:MM | כותרת" (time optional); lines starting with "?" are
 * guiding questions; everything else is the body.
 */
export function parseAgenda(text: string): AgendaInput[] {
  return text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block, i) => {
      const lines = block.split("\n").map((l) => l.trim());
      const first = lines.shift() ?? "";
      const [a, b] = first.includes("|") ? first.split("|").map((s) => s.trim()) : ["", first];
      const questions = lines.filter((l) => l.startsWith("?")).map((l) => l.replace(/^\?\s*/, ""));
      const body = lines.filter((l) => !l.startsWith("?") && l).join("\n");
      return { time_label: a, title: b || "ללא כותרת", body, questions, sort_order: i + 1 };
    });
}

export function agendaToText(items: { time_label: string; title: string; body: string; questions: string[] }[]): string {
  return items.map((a) => [`${a.time_label ? a.time_label + " | " : ""}${a.title}`, a.body, ...a.questions.map((q) => `? ${q}`)].filter(Boolean).join("\n")).join("\n\n");
}
