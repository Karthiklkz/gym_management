import { UserStatus } from '../shared';

export interface Gym {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  subscriptionPlanId: string;
  status: UserStatus;
  createdAt: Date;
}

export interface Branch {
  id: string;
  gymId: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  phone?: string;
  createdAt: Date;
}
