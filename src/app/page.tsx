import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  redirect(session ? homeFor(session.profile) : "/login");
}
