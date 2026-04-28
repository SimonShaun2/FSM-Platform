export const AUTH_COOKIE_NAME = "fsm_auth_token";

function getCookieValue(name: string, cookieSource: string): string | null {
  const cookies = cookieSource.split(";").map((entry) => entry.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return cookie.slice(name.length + 1);
    }
  }

  return null;
}

export function getToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  return getCookieValue(AUTH_COOKIE_NAME, document.cookie);
}

export function clearToken(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
