import Link from "next/link";
import AdminForgotPasswordForm from "@/components/adminPlatform/form/forgotPasswordForm";
import { ADMIN_SIGNUP_URL } from "@/constant/navigation";
import AuthScreenLayout from "../authScreenLayout";

export default function AdminForgotPasswordPage() {
    return (
        <AuthScreenLayout
            title="Reset Password"
            description="A reset link will be sent to your mail."
            fillScreen
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
            <AdminForgotPasswordForm />
        </AuthScreenLayout>
    );
}
