import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { getPublicApiBaseUrl, resolveLegacyEstimateGetRecovery } from "@/src/lib/legacy-estimate-route";
import {
  hasPublicApiPathTraversalInRequest,
  isAllowedPublicApiProxyMethod,
  isPublicApiProxyPath
} from "@/src/lib/public-api-path-security";
import { canRoleAccessPath, getDefaultRouteForRole, isPublicRoute, normalizeUserRole } from "@/src/lib/route-access";

interface TokenPayload {
  role?: string;
  exp?: number;
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

    return atob(padded);
  } catch {
    return null;
  }
}

function readTokenPayload(token: string): TokenPayload | null {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  const decoded = decodeBase64Url(payload);

  if (!decoded) {
    return null;
  }

  try {
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

function isLegacyEstimateRecoveryMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isLegacyEstimateRecoveryMethod(request.method)) {
    const legacyRecovery = await resolveLegacyEstimateGetRecovery(pathname, getPublicApiBaseUrl());

    if (legacyRecovery.action === "redirect-approve") {
      return NextResponse.redirect(new URL(`/approve/${legacyRecovery.token}`, request.url), 307);
    }

    if (legacyRecovery.action === "rewrite-approve") {
      return NextResponse.rewrite(new URL(`/approve/${legacyRecovery.token}`, request.url));
    }

    if (legacyRecovery.action === "not-found") {
      return new NextResponse(null, { status: 404 });
    }
  }

  if (isPublicApiProxyPath(pathname)) {
    if (!isAllowedPublicApiProxyMethod(request.method)) {
      return new NextResponse(null, { status: 405 });
    }

    if (hasPublicApiPathTraversalInRequest(request.url, pathname)) {
      return new NextResponse(null, { status: 400 });
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const isRoutePublic = isPublicRoute(pathname);

  if (!token) {
    if (isRoutePublic) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = readTokenPayload(token);
  const role = normalizeUserRole(payload?.role);
  const isExpired = typeof payload?.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000);

  if (!role || isExpired) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_TOKEN_COOKIE_NAME);
    return response;
  }

  if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url));
  }

  if (isRoutePublic) {
    return NextResponse.next();
  }

  if (!canRoleAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
