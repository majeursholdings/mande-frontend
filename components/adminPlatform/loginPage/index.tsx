import Link from "next/link";
import AdminLoginForm from "@/components/adminPlatform/form/loginForm";
import { ADMIN_SIGNUP_URL } from "@/constant/navigation";
import AuthScreenLayout from "../authScreenLayout";

export default function AdminLoginPage() {
    return (
        <AuthScreenLayout
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
                        href={ADMIN_SIGNUP_URL}
                        className="ml-1 font-medium text-secondary-700 hover:underline"
                    >
                        Register
                    </Link>
                </>
            }
        >
            <AdminLoginForm />
        </AuthScreenLayout>
    );
}
