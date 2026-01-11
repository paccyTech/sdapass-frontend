'use client';

import { useEffect, useState } from "react";

import type { AuthSession } from "../lib/auth";
import { AUTH_EVENT_KEY, readAuthSession } from "../lib/auth";

export const useAuthSession = (): AuthSession => {
  const [session, setSession] = useState<AuthSession>(() => readAuthSession());

  useEffect(() => {
    const handle = () => setSession(readAuthSession());

    if (typeof window !== "undefined") {
      window.addEventListener(AUTH_EVENT_KEY, handle);
      handle();
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(AUTH_EVENT_KEY, handle);
      }
    };
  }, []);

  return session;
};
