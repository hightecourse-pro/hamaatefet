/** What a member does in a forum section – one button only (the owner, 2/11 night). Shared by server and client code. */
export type MemberAction = "thread" | "help_ask" | "question" | "request" | "none";
const ACTIONS: MemberAction[] = ["thread", "help_ask", "question", "request", "none"];
export const asAction = (v: string): MemberAction => (ACTIONS.includes(v as MemberAction) ? (v as MemberAction) : "request");
