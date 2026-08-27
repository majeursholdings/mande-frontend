import Image from "next/image";

export default function Logo() {
  return (
    <Image 
        src={'/MANDE-logo.png'}
        alt={"MANDE Logo"}
        title={"MANDE Logo"}
        width={500}
        height={364}
        className="aspect-500/364 max-w-15 w-full"
    />
  )
}
