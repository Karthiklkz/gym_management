export interface SubscriptionPlan {
  id: string;
  name: string;
  maxBranches: number;
  maxTrainers: number;
  maxMembers: number;
  price: number;
  billingCycle: string;
  createdAt: Date;
}
