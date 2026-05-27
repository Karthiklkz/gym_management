import { PaymentMethod, PaymentStatus } from '../shared';

export interface Payment {
  id: string;
  memberId: string;
  membershipId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
}
