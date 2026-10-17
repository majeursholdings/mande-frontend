import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import VideoPlayer from "../common/videoPlayer";

/** Makers' stories, on video. */
export default function TestimonialSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col items-center gap-8 md:gap-12">
            <div className="flex max-w-175 flex-col items-center gap-3 text-center">
                <span className="text-lg font-medium">Makers on MANDE</span>
                <SectionHeading as="h2">Hear it from the makers who build with us.</SectionHeading>
                <p className="text-base font-light">
                    Furniture makers share what building with MANDE is like, in their own workshops.
                </p>
            </div>
            <VideoPlayer
                src="https://www.mande.com.ng/media/hands-that-build.mp4"
                title="Hands that build"
                className="aspect-video w-full max-w-3xl"
            />
        </SectionWrapper>
    );
}
