export type UserRole = 'SUPER_ADMIN' | 'GYM_ADMIN' | 'TRAINER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'ONLINE';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
  timestamp: string;
}
