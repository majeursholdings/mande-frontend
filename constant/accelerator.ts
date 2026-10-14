// The MANDE Accelerator Program: loans for makers on MANDE. Kept apart, with
// no imports, so any page can show it. Change the amount here when the
// programme changes.

export const ACCELERATOR_PROGRAM_NAME = "MANDE Accelerator Program";

/** The most a maker can borrow through the programme, as shown on the website. */
export const ACCELERATOR_LOAN_LABEL = "₦10 million";

/** The maker ranks (ids from MANUFACTURER_RANKS in constant/points.ts) that qualify easily for a loan. */
export const ACCELERATOR_QUALIFYING_RANK_IDS: readonly string[] = ["expert-maker", "master-craftsman"];
