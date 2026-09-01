import { cn } from "@/lib/utils";
import React, { ComponentProps } from "react";

export interface SectionWrapperProps extends ComponentProps<"section"> {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  containerProps?: ComponentProps<"div">;
}

export default function SectionWrapper({
  children,
  className,
  containerClassName,
  containerProps,
  ...props
}: SectionWrapperProps) {
  const { className: extraContainerClassName, ...restContainerProps } =
    containerProps || {};

  return (
    <section className={cn("py-12.5 md:py-25 px-2.5", className)} {...props}>
      <div
        className={cn(
          "container mx-auto",
          containerClassName,
          extraContainerClassName
        )}
        {...restContainerProps}
      >
        {children}
      </div>
    </section>
  );
}

export { SectionWrapper };

