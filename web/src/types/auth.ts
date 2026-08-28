import type { User } from "./user";

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CurrentUserResponse {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterDetails extends LoginCredentials {
  firstName: string;
  lastName: string;
}
