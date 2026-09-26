import { ReceiptText } from "lucide-react";
import {
    MANUFACTURER_TRANSACTIONS_URL,
    type ManufacturerTransaction,
} from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import ProfileSectionCard from "./profileSectionCard";
import TransactionListItem from "./transactionListItem";

const PREVIEW_COUNT = 4;

export default function TransactionsPreview({
    transactions,
}: {
    transactions: ManufacturerTransaction[];
}) {
    const hasTransactions = transactions.length > 0;

    return (
        <ProfileSectionCard
            title="Transactions"
            viewAllHref={hasTransactions ? MANUFACTURER_TRANSACTIONS_URL : undefined}
        >
            {hasTransactions ? (
                <ul className="flex flex-col gap-5">
                    {transactions.slice(0, PREVIEW_COUNT).map((transaction) => (
                        <TransactionListItem key={transaction.id} transaction={transaction} />
                    ))}
                </ul>
            ) : (
                <div className="flex flex-1 items-center justify-center">
                    <EmptyState
                        icon={ReceiptText}
                        title="No Transactions"
                        description="There are no transactions to display"
                    />
                </div>
            )}
        </ProfileSectionCard>
    );
}
