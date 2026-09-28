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
      <OfferBar />
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer/>
    </>
  );
}
