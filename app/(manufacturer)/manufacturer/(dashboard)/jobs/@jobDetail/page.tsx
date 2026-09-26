// Matches /manufacturer/jobs inside the @jobDetail slot so the sheet closes
// when the sheet navigates back to the board. On a client-side navigation a
// slot with no match keeps showing its previous content (default.tsx only
// covers hard loads), which left the sheet open with the URL already changed.
export default function JobDetailSlotIndex() {
    return null;
}
