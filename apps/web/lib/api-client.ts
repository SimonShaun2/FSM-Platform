import type { ErrorCode } from "@fsm/types";

import { clearToken, getToken } from "./auth";

export interface ApiErrorPayload {
  error: ErrorCode | "NOT_IMPLEMENTED";
  message: string;
  requestId?: string;
  fields?: Record<string, string>;
}

function getApiBaseUrl(): string {
  if (typeof document === "undefined") {
    return "http://localhost:3001";
  }

  return document.body.dataset.apiBaseUrl ?? "http://localhost:3001";
}

export async function apiClient<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
  const headers = new Headers(init.headers);
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers
  });

  if (response.status === 401) {
    clearToken();

    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    let errorPayload: ApiErrorPayload = {
      error: "NOT_IMPLEMENTED",
      message: "Request failed"
    };

    try {
      errorPayload = (await response.json()) as ApiErrorPayload;
    } catch {
      errorPayload = {
        error: "NOT_IMPLEMENTED",
        message: "Request failed"
      };
    }

    throw errorPayload;
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
