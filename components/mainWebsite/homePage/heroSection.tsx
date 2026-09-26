import { clientList } from "@/constant/global"
import { ARTISAN_SIGNUP_URL } from "@/constant/navigation"
import Image from "next/image"
import Link from "next/link"

export default function HomeHeroSection() {
  return (
    <section className="bg-mist-200">
        <div>

        </div>
        <div className="aspect-video py-12.5 md:py-25 px-2.5 flex flex-col items-center justify-center gap-10">
            <div className="flex flex-col gap-5 items-center text-center text-pretty">
                <h1 className="text-lg font-medium">
                    Start making money from MANDE today!
                </h1>
                <h2 className="text-3xl md:text-5xl max-w-175 tracking-tight">
                    Grow your furniture business from local customers to an international audience.
                </h2>
                <Link
                    href={ARTISAN_SIGNUP_URL}
                    title="Create your profile"
                    className="flex w-fit mt-3 rounded-button py-1.5 px-5 border bg-primary-950 border-primary-950 text-mist-100 hover:bg-primary-500 hover:border-primary-500 hover:text-primary-950 duration-300 transition-all"
                >
                    Create your profile
                </Link>
            </div>
            <div className="flex flex-col gap-4 items-center mt-20">
                <span className="text-lg font-light">
                    Start making furniture for leading brand
                </span>
                <div className="grid items-center grid-cols-3 md:grid-cols-6 gap-10">
                    {clientList.map((item) => (
                        <Image
                            key={item.id}
                            {...item}
                            className="object-center object-cover max-w-20"
                        />
                    ))}
                </div>
            </div>
        </div>
    </section>
  )
}
