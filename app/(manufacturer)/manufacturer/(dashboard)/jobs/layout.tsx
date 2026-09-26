import type { ReactNode } from "react";

export default function JobsLayout({
    children,
    jobDetail,
}: {
    children: ReactNode;
    jobDetail: ReactNode;
}) {
    return (
        <>
            {children}
            {jobDetail}
        </>
    );
}
