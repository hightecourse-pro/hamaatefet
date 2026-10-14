/**
 * Which environment is this deployment? NEXT_PUBLIC_APP_ENV is set per Vercel
 * project ("staging" / "production"). FAIL CLOSED: a production build without
 * the variable reports "staging", so real-world side effects (email to real
 * members) stay blocked unless production is explicitly declared.
 */
export type AppEnv = "production" | "staging" | "development";

export function appEnv(): AppEnv {
  const v = process.env.NEXT_PUBLIC_APP_ENV;
  if (v === "production" || v === "staging") return v;
  return process.env.NODE_ENV === "production" ? "staging" : "development";
}

export function isProductionEnv(): boolean {
  return appEnv() === "production";
}
