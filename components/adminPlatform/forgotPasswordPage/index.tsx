import Link from "next/link";
import AdminForgotPasswordForm from "@/components/adminPlatform/form/forgotPasswordForm";
import { ADMIN_AUTH, type AuthPlatform } from "../authPlatforms";
import AuthScreenLayout from "../authScreenLayout";

/** Reset password — the admin's, or the super admin's with its `platform`. */
export default function AdminForgotPasswordPage({ platform = ADMIN_AUTH }: { platform?: AuthPlatform }) {
    return (
        <AuthScreenLayout
            platformLabel={platform.label}
            title="Reset Password"
            description="A reset link will be sent to your mail."
            fillScreen
            footer={
                // Super admins only join by invite: no sign-up to point to
                platform.inviteOnly ? (
                    <>New super admins join from the invite link in their email.</>
                ) : (
                    <>
                        Don&apos;t have an account?{" "}
                        <Link
                            href={platform.signupUrl}
                            className="ml-1 font-medium text-secondary-700 hover:underline"
                        >
                            Register
                        </Link>
                    </>
                )
            }
        >
            <AdminForgotPasswordForm />
        </AuthScreenLayout>
    );
}
