export type EventType =
  | "page_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "purchase";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
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
};

export type OverviewResponse = {
  revenue: {
    todayCents: number;
    weekCents: number;
    monthCents: number;
    currency: string;
  };
  eventCounts: Record<EventType, number>;
  conversionRate: number;
  lastUpdatedAt: string;
};

export type TopProductsResponse = {
  range: "today" | "week" | "month";
  currency: string;
  items: Array<{
    productId: string;
    revenueCents: number;
    purchaseCount: number;
  }>;
};

export type RecentActivityResponse = {
  items: Array<{
    eventId: string;
    eventType: EventType;
    occurredAt: string;
    productId: string | null;
    amountCents: number | null;
    currency: string | null;
  }>;
};

export type TrendResponse = {
  currency: string;
  items: Array<{
    date: string;
    revenueCents: number;
    purchases: number;
    pageViews: number;
    conversionRate: number;
  }>;
};

export type ApiErrorResponse = {
  statusCode?: number;
  message?: string;
};
