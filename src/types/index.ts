export type Role =
  | "ADMIN"
  | "HEADQUARTERS_MANAGER"
  | "BRANCH_MANAGER"
  | "CUSTOMER"
  | "WAITER"
  | "CHEF"
  | "CASHIER";

export type User = {
  userId?: number;
  id?: number;
  email: string;
  name?: string;
  role: Role;
  branchId: number | null;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type LoginResponse = {
  token: string;
  user: User;
};

export type DashboardReport = {
  branches: number;
  users: number;
  orders: number;
  payments: number;
  salesTotal: number;
};
