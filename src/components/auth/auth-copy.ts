import type { Content } from "@/lib/content";
import type { AuthCopy } from "./auth-screen";

/** The login screen's copy, from the content registry (server side). */
export function authCopy(c: Content): AuthCopy {
  return {
    loginTitle: c.get("auth.login.title"),
    loginSubtitle: c.get("auth.login.subtitle"),
    loginButton: c.get("auth.login.button"),
    noAccount: c.get("auth.login.noaccount"),
    signupTitle: c.get("auth.signup.title"),
    signupSubtitle: c.get("auth.signup.subtitle"),
    age: c.get("auth.signup.age"),
    terms: c.get("auth.signup.terms"),
    termsLink: c.get("auth.signup.terms_link"),
    signupButton: c.get("auth.signup.button"),
    pendingTitle: c.get("auth.pending.title"),
    pendingText: c.get("auth.pending.text"),
    forgotTitle: c.get("auth.forgot.title"),
    forgotText: c.get("auth.forgot.text"),
    forgotButton: c.get("auth.forgot.button"),
    sentTitle: c.get("auth.sent.title"),
    sentText: c.get("auth.sent.text"),
    sideHeadline: c.get("auth.side.headline"),
    sideLines: c.lines("auth.side.lines"),
  };
}
