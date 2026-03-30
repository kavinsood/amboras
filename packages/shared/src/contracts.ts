export type EventType =
  | "page_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "purchase";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
    timezone: string;
    currency: string;
  };
}

export interface OverviewResponse {
  revenue: {
    todayCents: number;
    weekCents: number;
    monthCents: number;
    currency: string;
  };
  eventCounts: Record<EventType, number>;
  conversionRate: number;
  lastUpdatedAt: string;
}

export interface TopProductsResponse {
  range: "today" | "week" | "month";
  currency: string;
  items: Array<{
    productId: string;
    revenueCents: number;
    purchaseCount: number;
  }>;
}

export interface RecentActivityResponse {
  items: Array<{
    eventId: string;
    eventType: EventType;
    occurredAt: string;
    productId: string | null;
    amountCents: number | null;
    currency: string | null;
  }>;
}

export interface TrendResponse {
  currency: string;
  items: Array<{
    date: string;
    revenueCents: number;
    purchases: number;
    pageViews: number;
    conversionRate: number;
  }>;
}

export interface LiveVisitorsResponse {
  count: number;
}

export interface ApiErrorResponse {
  statusCode?: number;
  message?: string;
}
