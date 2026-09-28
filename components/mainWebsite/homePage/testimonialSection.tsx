import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import VideoPlayer from "../common/videoPlayer";

/** Makers' stories, on video. */
export default function TestimonialSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col items-center gap-8 md:gap-12">
            <div className="flex max-w-175 flex-col items-center gap-3 text-center">
                <SectionHeading as="h2">Watch how other furniture makers grow on MANDE.</SectionHeading>
                <p className="text-base font-light">Hear from the makers who build with us, in their own workshops.</p>
            </div>
            <VideoPlayer
                src="https://www.mande.com.ng/media/hands-that-build.mp4"
                className="aspect-video w-full max-w-3xl"
            />
        </SectionWrapper>
    );
}
