import Link from "next/link";
import AdminLoginForm from "@/components/adminPlatform/form/loginForm";
import { ADMIN_AUTH, type AuthPlatform } from "../authPlatforms";
import AuthScreenLayout from "../authScreenLayout";

/** Log in — the admin's, or the super admin's with its `platform`. */
export default function AdminLoginPage({ platform = ADMIN_AUTH }: { platform?: AuthPlatform }) {
    return (
        <AuthScreenLayout
            platformLabel={platform.label}
            title={
                <>
                    Log in to <span className="text-secondary-700">Mande!</span>
                </>
            }
            description="Welcome back, log into your account."
            footer={
                <>
                    Don&apos;t have an account?{" "}
                    <Link
                        href={platform.signupUrl}
                        className="ml-1 font-medium text-secondary-700 hover:underline"
                    >
                        Register
                    </Link>
                </>
            }
        >
            <AdminLoginForm dashboardUrl={platform.dashboardUrl} forgotPasswordUrl={platform.forgotPasswordUrl} />
        </AuthScreenLayout>
    );
}
