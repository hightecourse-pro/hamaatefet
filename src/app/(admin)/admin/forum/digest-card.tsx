"use client";

import { setDigestEnabled, sendDigestSampleToMe } from "../actions";
import { ActionButton, Toggle } from "../ui";

/** The daily-digest switch, what the last run did, and a "send me a sample" button. */
export function DigestCard({ enabled, lastLabel, email, time }: { enabled: boolean; lastLabel: string; email: string; time: string }) {
  return (
    <div data-testid="digest-card" style={{ background: "#FFFFFF", border: "2px solid #F0E2D8", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        <span className="grad">הסיכום היומי במייל</span>
      </h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#5A3348" }}>
        כל יום ב-{time} (שעון ישראל), חוץ משבת ויום טוב, נשלח לכל החברות הפעילות מייל אחד עם מה שחדש מאז הסיכום הקודם: דיונים חדשים, דיונים שקיבלו תגובות, ומפגשים חדשים ביומן. ביום שקט לא נשלח כלום. חברה יכולה לכבות את זה אצלה ב«החשבון שלי»; הנוסח – ב«תוכן האתר» › מיילים מהמערכת.
      </p>
      <Toggle checked={enabled} label="הסיכום היומי פעיל" action={setDigestEnabled} />
      <span style={{ fontSize: 14, color: "#6A4558" }}>{lastLabel}</span>
      <div>
        <ActionButton className="btn-sm" action={sendDigestSampleToMe}>
          שליחת דוגמה אליי ({email})
        </ActionButton>
      </div>
    </div>
  );
}
