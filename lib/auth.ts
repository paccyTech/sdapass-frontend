import type { RoleKey } from "./rbac";

export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_USER_KEY = "authUser";
export const AUTH_EVENT_KEY = "auth:changed";

export type AuthUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role: RoleKey;
  unionId?: string | null;
  districtId?: string | null;
  churchId?: string | null;
};

export type AuthSession = {
  token: string | null;
  user: AuthUser | null;
};

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse stored auth user", error);
    return null;
  }
};

export const readAuthSession = (): AuthSession => {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const user = safeParse<AuthUser>(localStorage.getItem(AUTH_USER_KEY));
  return { token, user };
};

const dispatchAuthEvent = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(AUTH_EVENT_KEY));
};

export const storeAuthSession = (token: string, user: AuthUser) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  dispatchAuthEvent();
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  dispatchAuthEvent();
};
