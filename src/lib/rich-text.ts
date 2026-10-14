import sanitizeHtml from "sanitize-html";

/** What rich text (posts, comments, the terms page) may contain. Everything else is stripped. */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "s", "ul", "ol", "li", "a", "blockquote", "h2", "h3", "div", "span"],
  allowedAttributes: { a: ["href", "target", "rel"], span: [], div: [] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: "_blank", rel: "noopener nofollow" } }),
  },
  exclusiveFilter: (frame) => frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren.length,
};

export function sanitizeRich(html: string): string {
  return sanitizeHtml(html ?? "", OPTIONS).trim();
}

/** Plain text of rich HTML – for previews, e-mails and length checks. */
export function richToText(html: string): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichEmpty(html: string): boolean {
  return richToText(html).length === 0 && !/<img|<ul|<ol/.test(html ?? "");
}
