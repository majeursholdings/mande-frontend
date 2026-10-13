import CtaBand from "../common/ctaBand";
import AboutSection from "./aboutSection";
import CommunitySection from "./communitySection";
import FactorySection from "./factorySection";
import HomeHeroSection from "./heroSection";
import HowItWorks from "./howItWorks";
import JobsListSection from "./jobsListSection";
import PricingSection from "./pricingSection";
import TestimonialSection from "./testimonialSection";

// The homepage, in the website's pattern: grey and white bands in turn (the
// hero, what MANDE is, how a job runs, open jobs, the Lagos factory and the
// Accelerator Program loan), the plans in dark green, makers' stories, the
// community's channels, and the sign-up band.
export default function HomePage() {
    return (
        <>
            <HomeHeroSection />
            <AboutSection />
            <HowItWorks />
            <JobsListSection />
            <FactorySection />
            <PricingSection />
            <TestimonialSection />
            <CommunitySection />
            <CtaBand />
        </>
    );
}
