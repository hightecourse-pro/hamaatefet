import { adImageUrl, type Ad } from "@/lib/ads";

/**
 * The team's advertisement: a 300px rectangle beside the content on wide
 * screens ("side"), a banner under it on phones ("bottom"); CSS shows one of
 * the two. Rendered only when an active ad exists.
 */
export function AdSlot({ ad, label, place }: { ad: Ad; label: string; place: "side" | "bottom" }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={adImageUrl(ad.image_path)} alt={ad.name} style={{ display: "block", width: "100%", height: "auto", maxHeight: 600, objectFit: "contain", borderRadius: 18, border: "2px solid #F0E2D8", background: "#FFFFFF" }} />
  );
  const Tag = place === "side" ? "aside" : "div";
  return (
    <Tag className={place === "side" ? "ad-side" : "ad-bottom"} data-testid={`ad-${place}`} aria-label={label}>
      <span style={{ display: "block", fontSize: 12, color: "#9A7F8C", marginBottom: 4, letterSpacing: 0.3 }}>{label}</span>
      {ad.link_url ? (
        <a href={`/ad/${ad.id}`} target="_blank" rel="noopener sponsored" aria-label={ad.name} style={{ display: "block" }}>
          {img}
        </a>
      ) : (
        img
      )}
    </Tag>
  );
}
