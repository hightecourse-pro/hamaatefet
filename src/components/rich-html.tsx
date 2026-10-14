/** Renders rich text that was sanitized on write (posts, comments, terms). */
export function RichHtml({ html, style, className = "" }: { html: string; style?: React.CSSProperties; className?: string }) {
  return <div className={`rich ${className}`.trim()} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}
