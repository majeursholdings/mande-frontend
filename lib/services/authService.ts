import { api, setStoredAccessToken } from "@/lib/api";

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
  role?: "manufacturer" | "admin" | "super_admin";
}

export interface LoginMfaRequiredResponse {
  mfaRequired: true;
  /** Where the code comes from: their email, or their authenticator app. */
  method: "email" | "app";
  /** "step_up": several wrong passwords were tried on this email, so a code is needed this time. */
  reason?: "step_up";
  mfaToken: string;
}

/** The signed-in account, as the API's /auth/me and login answers give it. */
export interface PublicUser {
  id: string;
  userId?: string | null;
  email: string;
  role: "manufacturer" | "admin" | "super_admin";
  superAdminRole: "owner" | "manager" | "tech-support" | null;
  status: "active" | "pending_verification" | "deactivated";
  emailVerified: boolean;
  twoFactorMethod: "email" | "app" | null;
  profile: Record<string, unknown> | null;
}

export interface LoginSuccessResponse {
  user: PublicUser;
  accessToken: string;
  accessTokenExpiresAt: string;
}

export type LoginResponse = LoginSuccessResponse | LoginMfaRequiredResponse;

export interface ManufacturerRegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface StaffRegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  position?: string;
}

export const authService = {
  /**
   * Log into account (manufacturer, admin, or super admin)
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    if ("accessToken" in data && data.accessToken) {
      setStoredAccessToken(data.accessToken);
    }
    return data;
  },

  /**
   * Complete 2FA login challenge with MFA token and 6-digit code
   */
  async login2FA(mfaToken: string, code: string): Promise<LoginSuccessResponse> {
    const { data } = await api.post<LoginSuccessResponse>("/auth/login/2fa", {
      mfaToken,
      code,
    });
    if (data.accessToken) {
      setStoredAccessToken(data.accessToken);
    }
    return data;
  },

  /**
   * Register a new manufacturer account
   */
  async registerManufacturer(payload: ManufacturerRegisterPayload): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/register/manufacturer",
      payload
    );
    return data;
  },

  /**
   * Register a staff account (restricted to staff email domain or invite)
   */
  async registerStaff(payload: StaffRegisterPayload): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/register/admin",
      payload
    );
    return data;
  },

  /**
   * Accept a super admin invite (the token from the invite link): sets their
   * password and phone, and signs them in. Name, email and role come from the invite.
   */
  async acceptInvite(token: string, password: string, phone: string): Promise<LoginSuccessResponse> {
    const { data } = await api.post<LoginSuccessResponse>("/auth/invites/accept", {
      token,
      password,
      phone,
    });
    if (data.accessToken) {
      setStoredAccessToken(data.accessToken);
    }
    return data;
  },

  /**
   * Verify email address with 6-digit one-time code
   */
  async verifyEmail(email: string, code: string): Promise<LoginSuccessResponse> {
    const { data } = await api.post<LoginSuccessResponse>("/auth/verify-email", {
      email,
      code,
    });
    if (data.accessToken) {
      setStoredAccessToken(data.accessToken);
    }
    return data;
  },

  /**
   * Resend email verification code
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("/auth/verify-email/resend", {
      email,
    });
    return data;
  },

  /**
   * Request password reset link/code
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/password/forgot",
      { email }
    );
    return data;
  },

  /**
   * Reset password with token from link or code
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/password/reset",
      { token, password: newPassword }
    );
    return data;
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      "/auth/password/change",
      payload
    );
    return data;
  },

  /**
   * Get current authenticated user profile
   */
  async me() {
    const { data } = await api.get("/auth/me");
    return data;
  },

  /**
   * Log out current session
   */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      setStoredAccessToken(null);
    }
  },

  /**
   * Send re-authentication code for sensitive operations (step-up verification)
   */
  async sendReauthCode(action?: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>("/auth/reauth/send-code", action ? { action } : {});
    return data;
  },

  /**
   * Confirm password and code to obtain X-Reauth-Token
   */
  async verifyReauth(password: string, code: string): Promise<{ reauthToken: string }> {
    const { data } = await api.post<{ reauthToken: string }>("/auth/reauth", {
      password,
      code,
    });
    return data;
  },

  /**
   * Setup Authenticator App 2FA
   */
  async setup2FAApp(reauthToken: string): Promise<{ secret: string; otpauthUrl: string }> {
    const { data } = await api.post<{ secret: string; otpauthUrl?: string; otpauthUri?: string }>(
      "/auth/2fa/app/setup",
      {},
      { headers: { "X-Reauth-Token": reauthToken } }
    );
    return {
      secret: data.secret,
      otpauthUrl: data.otpauthUrl || data.otpauthUri || "",
    };
  },

  /**
   * Send code to email for enabling 2FA
   */
  async sendEmailTwoFactorCode(reauthToken: string): Promise<void> {
    await api.post(
      "/auth/2fa/email/send-code",
      {},
      { headers: { "X-Reauth-Token": reauthToken } }
    );
  },

  /**
   * Enable 2FA with app code
   */
  async enable2FA(method: "app" | "email", code: string, reauthToken: string): Promise<void> {
    await api.post(
      "/auth/2fa/enable",
      { method, code },
      { headers: { "X-Reauth-Token": reauthToken } }
    );
  },

  /**
   * Disable 2FA
   */
  async disable2FA(reauthToken: string): Promise<void> {
    await api.post(
      "/auth/2fa/disable",
      {},
      { headers: { "X-Reauth-Token": reauthToken } }
    );
  },
};
