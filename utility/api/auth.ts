import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
};

// API module function (just the fetch request)
export const loginUser = async (credentials: LoginCredentials) => {
  return apiClient<any>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

// The React Query hook wrapper
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: loginUser,
  });
};

export const registerUser = async (data: RegisterData) => {
  return apiClient<any>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: registerUser,
  });
};
