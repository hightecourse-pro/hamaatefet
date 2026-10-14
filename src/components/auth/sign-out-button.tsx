export function SignOutButton({ label = "יציאה מהחשבון", style }: { label?: string; style?: React.CSSProperties }) {
  return (
    <form action="/auth/signout" method="post" style={{ display: "inline" }}>
      <button type="submit" className="btn-link" style={{ fontSize: 17, padding: "10px 4px", textDecoration: "none", ...style }}>
        {label}
      </button>
    </form>
  );
}
