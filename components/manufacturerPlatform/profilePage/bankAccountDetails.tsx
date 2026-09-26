import { Trash2 } from "lucide-react";
import type { ManufacturerBankAccount } from "@/constant/manufacturer";

export default function BankAccountDetails({
    bankAccount,
    onDelete,
}: {
    bankAccount: ManufacturerBankAccount;
    onDelete: () => void;
}) {
    const details = [
        { label: "Account number", value: bankAccount.accountNumber },
        { label: "Beneficiary name", value: bankAccount.accountName },
        { label: "Bank name", value: bankAccount.bankName },
        { label: "Currency", value: bankAccount.currency },
    ];

    return (
        <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                {details.map((detail) => (
                    <div key={detail.label} className="min-w-0">
                        <dt className="text-xs font-text uppercase tracking-wide text-mist-500">
                            {detail.label}
                        </dt>
                        <dd className="mt-1 text-base font-text text-mist-950 wrap-anywhere">
                            {detail.value}
                        </dd>
                    </div>
                ))}
            </dl>
            <button
                type="button"
                onClick={onDelete}
                className="mx-auto flex items-center gap-2 text-sm font-medium font-text text-error-600 hover:underline cursor-pointer"
            >
                <Trash2 className="size-4" />
                Delete account
            </button>
        </div>
    );
}
