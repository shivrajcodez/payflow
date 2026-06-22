# PayFlow API Documentation

## Base URL
```
http://localhost:8080/api
```
All endpoints are versioned under `/v1`.

---

## Authentication

PayFlow uses JWT Bearer tokens. Include the token in every request:
```
Authorization: Bearer <access_token>
```

Access tokens expire in **15 minutes**. Use the refresh token to get a new pair before expiry.

---

## Auth Endpoints

### POST /v1/auth/register

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "status": "ACTIVE"
    }
  }
}
```

---

### POST /v1/auth/login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password@123"
}
```

---

### POST /v1/auth/refresh

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

---

## Payment Endpoints

### POST /v1/payments

Creates a new payment. Use `idempotencyKey` to safely retry.

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "USD",
  "paymentMethod": "CARD",
  "description": "Pro subscription",
  "idempotencyKey": "order_12345",
  "customerEmail": "customer@example.com",
  "customerName": "Jane Smith",
  "cardLastFour": "4242",
  "cardBrand": "Visa",
  "cardExpMonth": 12,
  "cardExpYear": 2027,
  "webhookUrl": "https://your-server.com/webhooks/payflow"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "paymentReference": "PAY20240101ABCD123456",
    "amount": 99.99,
    "currency": "USD",
    "status": "PENDING",
    "paymentMethod": "CARD",
    "processingFee": 3.20,
    "netAmount": 96.79,
    "riskScore": 5,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**Currencies:** `USD`, `EUR`, `GBP`, `INR`, `JPY`, `CAD`, `AUD`

**Payment Methods:** `CARD`, `BANK_TRANSFER`, `WALLET`, `CRYPTO`

**Payment Statuses:** `PENDING` → `PROCESSING` → `COMPLETED` | `FAILED` | `CANCELLED`

---

### GET /v1/payments

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (0-based) |
| `size` | int | Page size (max 100) |
| `sortBy` | string | Field to sort by |
| `sortDir` | string | `asc` or `desc` |
| `status` | enum | Filter by status |
| `currency` | enum | Filter by currency |
| `from` | ISO datetime | Filter from date |
| `to` | ISO datetime | Filter to date |
| `minAmount` | decimal | Minimum amount |
| `maxAmount` | decimal | Maximum amount |
| `query` | string | Search reference/email |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 142,
    "totalPages": 8,
    "first": true,
    "last": false
  }
}
```

---

### POST /v1/payments/{paymentId}/refund

**Request Body:**
```json
{
  "amount": 49.99,
  "reason": "Customer request",
  "notes": "Partial refund approved"
}
```
Omit `amount` for a full refund.

---

## Error Codes

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource (email, idempotency key) |
| `UNPROCESSABLE_ENTITY` | 422 | Business rule violation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Fraud Detection

Every payment is scored 0–100. Score thresholds:

| Score | Level | Action |
|---|---|---|
| 0–24 | LOW | Process normally |
| 25–49 | MEDIUM | Flag for review |
| 50–74 | HIGH | Flag + notify admin |
| 75–100 | CRITICAL | Auto-block payment |

Signals evaluated:
- High transaction amount (>$10,000)
- High frequency from same user (>5/min)
- Duplicate amounts in same window
- Round-number large amounts
- New account + high-value transaction
- Missing customer info on large payments

---

## Webhooks

If you provide `webhookUrl` on payment creation, PayFlow will POST to that URL on status changes:

```json
{
  "eventType": "payment.completed",
  "eventId": "evt_abc123",
  "paymentId": "550e8400...",
  "paymentReference": "PAY20240101...",
  "amount": 99.99,
  "currency": "USD",
  "status": "COMPLETED",
  "occurredAt": "2024-01-01T12:01:30Z"
}
```

Events: `payment.created`, `payment.completed`, `payment.failed`, `refund.completed`

---

## Rate Limits

| Endpoint Group | Limit |
|---|---|
| `/v1/payments` (write) | 10 req/min per IP |
| All other endpoints | 100 req/min per IP |

Headers returned:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
Retry-After: 60
```

---

## WebSocket (Real-time Notifications)

Connect with STOMP over SockJS:

```javascript
const client = new StompClient({
  webSocketFactory: () => new SockJS('/api/ws'),
  connectHeaders: { Authorization: `Bearer ${token}` }
});
client.activate();
client.subscribe('/user/queue/notifications', (msg) => {
  const { type, data } = JSON.parse(msg.body);
  // type: PAYMENT_SUCCESS | PAYMENT_FAILED | REFUND_COMPLETED | FRAUD_ALERT
});
```
