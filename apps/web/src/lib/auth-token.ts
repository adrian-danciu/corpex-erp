import type { Department } from "@/types/auth.types";

export type AuthTokenPayload = {
  department?: Department | null;
  position?: string | null;
};

export function decodeJwtPayload(token: string): AuthTokenPayload {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}
