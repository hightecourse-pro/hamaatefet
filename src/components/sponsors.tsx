import Image from "next/image";

export interface SponsorLabels {
  sponsors: string;
  sponsorBv: string;
  sponsorHop: string;
}

/**
 * The two sponsor logos (the owner, 2/11): top-left on every screen, inside the
 * member area (header) and outside (the login flows). Sizes live in globals.css (.sponsors).
 */
export function Sponsors({ labels, compact = false }: { labels: SponsorLabels; compact?: boolean }) {
  return (
    <div className={compact ? "sponsors sponsors-compact" : "sponsors"} role="group" aria-label={labels.sponsors} title={labels.sponsors} style={{ display: "flex", alignItems: "center", gap: 14, direction: "ltr" }}>
      <Image src="/sponsors/beit-vegan.png" alt={labels.sponsorBv} width={411} height={200} />
      <Image src="/sponsors/had-o-pan.png" alt={labels.sponsorHop} width={796} height={247} />
    </div>
  );
}
