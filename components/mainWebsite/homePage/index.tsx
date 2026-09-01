import AboutSection from "./aboutSection";
import HomeHeroSection from "./heroSection";
import HowItWorks from "./howItWorks";
import JobsListSection from "./jobsListSection";
import PricingSection from "./pricingSection";
import TestimonialSection from "./testimonialSection";

export default function HomePage() {
  return (
    <>
        <HomeHeroSection/>
        <AboutSection/>
        <HowItWorks/>
        <JobsListSection/>
        <PricingSection/>
        <TestimonialSection/>
    </>
  )
}

