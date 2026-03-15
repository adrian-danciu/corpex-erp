export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum Department {
  HR = "HR",
  FINANCE = "FINANCE",
  WAREHOUSE = "WAREHOUSE",
  FLEET = "FLEET",
  MANAGEMENT = "MANAGEMENT",
  IT = "IT",
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: UserRole;
  department?: Department | null;
  position?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
