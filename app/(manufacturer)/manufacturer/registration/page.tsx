import ManufacRegPage from "@/components/manufacturerPlatform/registrationPage";

/** The first value of a search param (the payment partner can repeat one). */
const firstParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

export default async function ManufacturerRegistrationPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // The pricing section links here with ?plan=<id> to preselect that plan,
    // and the payment partner's checkout comes back with ?reference=<payment>
    const { plan, reference, trxref } = await searchParams;
    return (
        <ManufacRegPage
            initialPlan={firstParam(plan)}
            paymentReference={firstParam(reference) ?? firstParam(trxref)}
        />
    );
}
