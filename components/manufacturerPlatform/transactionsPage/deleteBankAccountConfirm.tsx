"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormCancelButton } from "@/components/manufacturerPlatform/form/formButtons";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import { getErrorMessage } from "@/lib/api";

/** The "Cancel / Yes, Delete" actions of the delete bank account dialog. */
export default function DeleteBankAccountConfirm({
    onCancel,
    onDeleted,
}: {
    onCancel: () => void;
    onDeleted: () => void;
}) {
    const { setBankAccount } = useManufacturerWallet();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await setBankAccount(null);
            toast.success("Bank account deleted successfully");
            onDeleted();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't delete your bank account. Please try again."));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex justify-end gap-3">
            <FormCancelButton onClick={onCancel} disabled={isDeleting} />
            <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-11 px-5 bg-error-600 hover:bg-error-700 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300 disabled:opacity-80"
            >
                {isDeleting ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Deleting...
                    </span>
                ) : (
                    "Yes, Delete"
                )}
            </Button>
        </div>
    );
}
