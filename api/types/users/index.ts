import { UserRole, UserStatus } from '../shared';

export interface User {
  id: string;
  gymId?: string;
  branchId?: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: Date;
  profileImage?: string;
  emergencyContact?: string;
}
