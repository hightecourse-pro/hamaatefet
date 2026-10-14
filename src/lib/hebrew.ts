import { HDate, gematriya } from "@hebcal/core";

/**
 * Hebrew months, Tishrei-first, as the community counts them: 1 תשרי … 12 אלול.
 * Adar I and Adar II both fold into 6 אדר.
 */
export const HEBREW_MONTHS = [
  "תשרי",
  "חשון",
  "כסלו",
  "טבת",
  "שבט",
  "אדר",
  "ניסן",
  "אייר",
  "סיון",
  "תמוז",
  "אב",
  "אלול",
] as const;

export type HebrewMonthIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export function monthName(index: number | null | undefined): string {
  if (!index || index < 1 || index > 12) return "";
  return HEBREW_MONTHS[index - 1];
}

export function monthOptions(): { value: number; label: string }[] {
  return HEBREW_MONTHS.map((label, i) => ({ value: i + 1, label }));
}

/** hebcal numbers months Nisan-first (Tishrei = 7, Adar I/II = 12/13). */
function fromHebcalMonth(m: number): HebrewMonthIndex {
  if (m === 13) return 6;
  const ours = m >= 7 ? m - 6 : m + 6;
  return ours as HebrewMonthIndex;
}

export interface HebrewToday {
  month: HebrewMonthIndex;
  monthName: string;
  year: number;
  day: number;
}

/** The Hebrew date in Jerusalem right now (the server's clock, shifted). */
export function hebrewToday(now: Date = new Date()): HebrewToday {
  // Evaluate the civil date in Israel; after sunset the Hebrew day already changed,
  // but the community meets by the printed calendar, so the civil day is what counts.
  const il = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  const hd = new HDate(il);
  return {
    month: fromHebcalMonth(hd.getMonth()),
    monthName: monthName(fromHebcalMonth(hd.getMonth())),
    year: hd.getFullYear(),
    day: hd.getDate(),
  };
}

const WEEKDAYS = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];

/** "יום רביעי, ג׳ חשון" for a civil date (YYYY-MM-DD). */
export function hebrewDateLabel(isoDate: string | null | undefined, withYear = false): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const civil = new Date(Date.UTC(y, m - 1, d, 12));
  const hd = new HDate(civil);
  const month = fromHebcalMonth(hd.getMonth());
  const day = gematriya(hd.getDate());
  const base = `${WEEKDAYS[civil.getUTCDay()]}, ${day} ${monthName(month)}`;
  return withYear ? `${base} ${hebrewYearLabel(hd.getFullYear())}` : base;
}

/** 5787 → תשפ״ז */
export function hebrewYearLabel(year: number): string {
  return gematriya(year % 1000);
}

/** "20:00–22:30" from two time strings ("20:00:00"). */
export function timeRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = (start ?? "").slice(0, 5);
  const e = (end ?? "").slice(0, 5);
  if (s && e) return `${s}–${e}`;
  return s || e || "";
}

/** "14.10.2026" */
export function civilDateLabel(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
}

/** Relative time in Hebrew for the feed: "לפני 3 שעות". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ממש עכשיו";
  if (min < 60) return min === 1 ? "לפני דקה" : `לפני ${min} דקות`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? "לפני שעה" : h === 2 ? "לפני שעתיים" : `לפני ${h} שעות`;
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? "אתמול" : d === 2 ? "לפני יומיים" : `לפני ${d} ימים`;
  const w = Math.floor(d / 7);
  if (w < 5) return w === 1 ? "לפני שבוע" : w === 2 ? "לפני שבועיים" : `לפני ${w} שבועות`;
  const mo = Math.floor(d / 30);
  return mo <= 1 ? "לפני חודש" : mo === 2 ? "לפני חודשיים" : `לפני ${mo} חודשים`;
}
