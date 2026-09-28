"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  authService,
  LoginPayload,
  LoginResponse,
  ManufacturerRegisterPayload,
} from "@/lib/services/authService";
import { queryKeys } from "@/lib/queryKeys";
import { MandeApiError } from "@/lib/types/api";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<LoginResponse, MandeApiError, LoginPayload>({
    mutationFn: (payload) => authService.login(payload),
    onSuccess: (data) => {
      if ("mfaRequired" in data && data.mfaRequired) {
        // Handled by 2FA screen
        return;
      }
      if ("user" in data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
        toast.success("Welcome back!");

        const role = data.user.role;
        if (role === "super_admin") {
          router.push("/super-admin/dashboard");
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/manufacturer/dashboard");
        }
      }
    },
    onError: (error) => {
      toast.error(error.message || "Invalid email or password");
    },
  });
}

export function useRegisterManufacturer() {
  const router = useRouter();

  return useMutation<{ message: string }, MandeApiError, ManufacturerRegisterPayload>({
    mutationFn: (payload) => authService.registerManufacturer(payload),
    onSuccess: (_, variables) => {
      toast.success("Account created! Check your email for verification code.");
      router.push(`/manufacturer/registration?step=verify&email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account. Please try again.");
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<unknown, MandeApiError, { email: string; code: string }>({
    mutationFn: ({ email, code }) => authService.verifyEmail(email, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success("Email verified successfully!");
      router.push("/manufacturer/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid or expired verification code.");
    },
  });
}

export function useForgotPassword() {
  return useMutation<{ message: string }, MandeApiError, string>({
    mutationFn: (email) => authService.forgotPassword(email),
    onSuccess: () => {
      toast.success("If an account exists, a reset link or code has been sent.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send reset link.");
    },
  });
}
