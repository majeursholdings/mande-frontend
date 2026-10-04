import { Suspense } from "react";
import Footer from "@/components/mainWebsite/navigations/footer";
import Header from "@/components/mainWebsite/navigations/header";
import OfferBar from "@/components/mainWebsite/navigations/offerBar";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Only while the plans have an offer, so nothing holds its place while it loads */}
      <Suspense fallback={null}>
        <OfferBar />
      </Suspense>
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer/>
    </>
  );
}
