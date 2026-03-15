import { User } from '../users';
import { UserProfile } from '../users';

export interface AuthResponse {
  user: Partial<User> & { profile: UserProfile | null };
  token: string;
}

export interface SignupResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
