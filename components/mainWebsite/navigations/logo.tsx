import Image from "next/image";

export default function Logo() {
    return (
        <Image
            src={"/MANDE-logo-white.png"}
            alt={"MANDE Logo"}
            title={"MANDE Logo"}
            width={236}
            height={56}
            className="aspect-118/28 w-full"
        />
    );
}

export const BlackLogo = () => {
    return (
        <Image
            src={"/MANDE-logo-black.png"}
            alt={"MANDE Logo"}
            title={"MANDE Logo"}
            width={236}
            height={56}
            className="aspect-118/28 w-full"
        />
    );
}
