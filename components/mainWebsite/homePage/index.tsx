import CtaBand from "../common/ctaBand";
import AboutSection from "./aboutSection";
import FactorySection from "./factorySection";
import HomeHeroSection from "./heroSection";
import HowItWorks from "./howItWorks";
import JobsListSection from "./jobsListSection";
import PricingSection from "./pricingSection";
import TestimonialSection from "./testimonialSection";

// The homepage, in the website's pattern: grey and white bands in turn (the
// hero, why MANDE, how a job runs, open jobs, the Lagos factory), the plans
// in dark green, makers' stories, and the sign-up band.
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
            <CtaBand />
        </>
    );
}
