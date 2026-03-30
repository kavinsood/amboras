import type {
  ApiErrorResponse,
  LoginRequest,
  LoginResponse,
  LiveVisitorsResponse,
  OverviewResponse,
  RecentActivityResponse,
  TrendResponse,
  TopProductsResponse
} from "@/lib/contracts";
import { readOrCreateVisitorId } from "@/lib/auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    return payload.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

function withAuthHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function login(input: LoginRequest) {
  return fetchJson<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getOverview(token?: string) {
  return fetchJson<OverviewResponse>("/api/v1/analytics/overview", {
    headers: withAuthHeaders(token)
  });
}

export function getTopProducts(token?: string, range: TopProductsResponse["range"] = "month") {
  return fetchJson<TopProductsResponse>(`/api/v1/analytics/top-products?range=${range}`, {
    headers: withAuthHeaders(token)
  });
}

export function getRecentActivity(token?: string) {
  return fetchJson<RecentActivityResponse>("/api/v1/analytics/recent-activity", {
    headers: withAuthHeaders(token)
  });
}

export function getTrend(token?: string, days = 14) {
  return fetchJson<TrendResponse>(`/api/v1/analytics/trend?days=${days}`, {
    headers: withAuthHeaders(token)
  });
}

export function getLiveVisitors(token?: string) {
  const visitorId = readOrCreateVisitorId();
  return fetchJson<LiveVisitorsResponse>("/api/v1/analytics/live-visitors", {
    headers: {
      ...withAuthHeaders(token),
      ...(visitorId ? { "X-Visitor-Id": visitorId } : {})
    }
  });
}
