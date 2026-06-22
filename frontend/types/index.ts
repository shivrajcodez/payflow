// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  apiKey?: string;
  emailVerified: boolean;
  avatarUrl?: string;
  timezone: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────
export type PaymentStatus =
  | 'PENDING' | 'PROCESSING' | 'COMPLETED'
  | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';

export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CRYPTO';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CAD' | 'AUD';

export interface Payment {
  id: string;
  paymentReference: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  cardLastFour?: string;
  cardBrand?: string;
  bankName?: string;
  failureCode?: string;
  failureMessage?: string;
  processingFee?: number;
  netAmount?: number;
  statementDescriptor?: string;
  receiptUrl?: string;
  riskScore?: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  idempotencyKey?: string;
  customerEmail?: string;
  customerName?: string;
  cardLastFour?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  bankAccountLastFour?: string;
  bankName?: string;
  webhookUrl?: string;
  statementDescriptor?: string;
}

// ─── Refunds ─────────────────────────────────────────────────────────────────
export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

export interface Refund {
  id: string;
  refundReference: string;
  paymentId: string;
  paymentReference: string;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason?: string;
  notes?: string;
  processedAt?: string;
  createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

export interface Analytics {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPercent: number;
  totalPayments: number;
  paymentsThisMonth: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  successRate: number;
  totalUsers: number;
  newUsersThisMonth: number;
  fraudFlagsCount: number;
  unreviewedFraudFlags: number;
  dailyRevenue: DailyRevenue[];
  paymentsByStatus: Record<string, number>;
  paymentsByMethod?: Record<string, number>;
}

// ─── Notifications ───────────────────────────────────────────────────────────
export type NotificationType =
  | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED' | 'FRAUD_ALERT' | 'ACCOUNT_ACTIVITY' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  paymentId?: string;
  createdAt: string;
}

// ─── API Common ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaymentFilterParams extends PaginationParams {
  status?: PaymentStatus;
  currency?: Currency;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  query?: string;
}
