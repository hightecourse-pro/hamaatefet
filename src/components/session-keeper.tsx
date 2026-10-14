"use client";

import { useEffect } from "react";

const SHORT_SESSION_MS = 8 * 60 * 60 * 1000;

/**
 * "זכרי אותי" unchecked at login = a short session (a shared computer): after
 * eight hours the next page view signs her out.
 */
export function SessionKeeper() {
  useEffect(() => {
    try {
      const only = window.localStorage.getItem("hm_session_only") === "1";
      const at = Number(window.localStorage.getItem("hm_login_at") ?? 0);
      if (only && at && Date.now() - at > SHORT_SESSION_MS) {
        window.localStorage.removeItem("hm_session_only");
        window.localStorage.removeItem("hm_login_at");
        const form = document.createElement("form");
        form.method = "post";
        form.action = "/auth/signout";
        document.body.appendChild(form);
        form.submit();
      }
    } catch {}
  }, []);
  return null;
}
