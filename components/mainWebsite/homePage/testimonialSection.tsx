import SectionHeading from "../common/sectionHeading"
import SectionWrapper from "../common/sectionWrapper"
import VideoPlayer from "../common/videoPlayer"

export default function TestimonialSection() {
    return (
        <SectionWrapper>
            <div className="w-full space-y-6 md:space-y-8">
                <div>
                    <SectionHeading className="text-center">
                        Watch how other furniture makers grow on Mande
                    </SectionHeading>
                </div>
                <div>
                    <VideoPlayer
                        src="https://www.mande.com.ng/media/hands-that-build.mp4"
                        className="aspect-video max-w-3xl mx-auto"
                    />
                </div>
            </div>
        </SectionWrapper>
    );
}
