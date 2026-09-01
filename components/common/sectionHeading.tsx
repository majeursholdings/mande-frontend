import { cn } from "@/lib/utils";
import React, { ComponentPropsWithoutRef } from "react";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type SectionHeadingProps<T extends HeadingLevel = "h3"> = {
  as?: T;
  className?: string;
  children: React.ReactNode;
} & ComponentPropsWithoutRef<T>;

export const sectionHeadingStyles =
    "text-2xl md:text-3xl lg:text-5xl tracking-tight capitalize";

export default function SectionHeading<T extends HeadingLevel = "h3">({
  as,
  className,
  children,
  ...props
}: SectionHeadingProps<T>) {
  const Component = as || "h3";

  return (
    <Component
      className={cn(sectionHeadingStyles, className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export { SectionHeading };

