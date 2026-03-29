# API Spec

## Auth

### `POST /api/v1/auth/login`
Request:

```json
{
  "email": "owner1@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "user_1",
    "email": "owner1@example.com"
  },
  "store": {
    "id": "store_1",
    "name": "Northwind Store",
    "timezone": "America/Los_Angeles",
    "currency": "USD"
  }
}
```

## Events

### `POST /api/v1/events`
Authorization: Bearer token required.

Request:

```json
{
  "event_id": "evt_123",
  "event_type": "purchase",
  "timestamp": "2026-03-24T10:30:00Z",
  "data": {
    "product_id": "prod_789",
    "amount": 49.99,
    "currency": "USD"
  }
}
```

Notes:
- `store_id` comes from the authenticated user context.
- `amount` is normalized to integer cents before storage.

## Analytics

### `GET /api/v1/analytics/overview`

```json
{
  "revenue": {
    "todayCents": 129900,
    "weekCents": 584300,
    "monthCents": 1824500,
    "currency": "USD"
  },
  "eventCounts": {
    "page_view": 12340,
    "add_to_cart": 1670,
    "remove_from_cart": 210,
    "checkout_started": 620,
    "purchase": 340
  },
  "conversionRate": 0.0276,
  "lastUpdatedAt": "2026-03-29T16:40:00Z"
}
```

`lastUpdatedAt` is the response generation timestamp for the aggregate payload. The UI treats this as the last successful fetch time, not as a persisted warehouse watermark.

### `GET /api/v1/analytics/top-products?range=month`

```json
{
  "range": "month",
  "currency": "USD",
  "items": [
    {
      "productId": "prod_789",
      "revenueCents": 245000,
      "purchaseCount": 42
    }
  ]
}
```

### `GET /api/v1/analytics/recent-activity`

```json
{
  "items": [
    {
      "eventId": "evt_123",
      "eventType": "purchase",
      "occurredAt": "2026-03-24T10:30:00Z",
      "productId": "prod_789",
      "amountCents": 4999,
      "currency": "USD"
    }
  ]
}
```

### `GET /api/v1/analytics/trend?days=14`

```json
{
  "currency": "USD",
  "items": [
    {
      "date": "2026-03-24",
      "revenueCents": 40600,
      "purchases": 4,
      "pageViews": 20,
      "conversionRate": 0.2
    }
  ]
}
```

## Error Contracts
- `400` invalid input
- `401` unauthenticated
- `403` unauthorized store access
- `409` duplicate event id
- `500` unexpected server error
