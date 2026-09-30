import { ADMIN_DASHBOARD_URL } from "@/constant/admin";
import {
    ADMIN_FORGOT_PASSWORD_URL,
    ADMIN_LOGIN_URL,
    ADMIN_SIGNUP_URL,
    SUPER_ADMIN_DASHBOARD_URL,
    SUPER_ADMIN_FORGOT_PASSWORD_URL,
    SUPER_ADMIN_LOGIN_URL,
    SUPER_ADMIN_SIGNUP_URL,
} from "@/constant/navigation";

/**
 * What differs between the staff platforms' log in, sign-up and reset
 * password screens — the admin's and the super admin's use the same screens
 * and forms, with these.
 */
export type AuthPlatform = {
    /** Over each screen's title, e.g. "Admin". */
    label: string;
    loginUrl: string;
    signupUrl: string;
    forgotPasswordUrl: string;
    /** Where logging in lands. */
    dashboardUrl: string;
    /** Under sign-up's title. */
    signupDescription: string;
    /** Whether sign-up asks for the person's position (admins pick one of ADMIN_POSITION_OPTIONS). */
    asksForPosition: boolean;
    /** The account role that logs in here: another role's account is turned away. */
    role: "admin" | "super_admin";
    /** Accounts only come from an invite (super admins): no open sign-up. */
    inviteOnly: boolean;
};

export const ADMIN_AUTH: AuthPlatform = {
    label: "Admin Platform",
    loginUrl: ADMIN_LOGIN_URL,
    signupUrl: ADMIN_SIGNUP_URL,
    forgotPasswordUrl: ADMIN_FORGOT_PASSWORD_URL,
    dashboardUrl: ADMIN_DASHBOARD_URL,
    signupDescription: "Create your account to get started as an admin.",
    asksForPosition: true,
    role: "admin",
    inviteOnly: false,
};

export const SUPER_ADMIN_AUTH: AuthPlatform = {
    label: "Super Admin Platform",
    loginUrl: SUPER_ADMIN_LOGIN_URL,
    signupUrl: SUPER_ADMIN_SIGNUP_URL,
    forgotPasswordUrl: SUPER_ADMIN_FORGOT_PASSWORD_URL,
    dashboardUrl: SUPER_ADMIN_DASHBOARD_URL,
    signupDescription: "Set your password to finish joining as a super admin.",
    asksForPosition: false,
    role: "super_admin",
    inviteOnly: true,
};
