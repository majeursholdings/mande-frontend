import ManufacRegPage from "@/components/manufacturerPlatform/registrationPage";

export default async function ManufacturerRegistrationPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // The pricing section links here with ?plan=<id> to preselect that plan
    const { plan } = await searchParams;
    return <ManufacRegPage initialPlan={typeof plan === "string" ? plan : undefined} />;
}
