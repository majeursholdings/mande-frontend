import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/userAvatar";
import type { ActivityActor, PlatformActivity } from "./platformActivity";

/** Who did it — their avatar, or Mande's leaf (as in the notifications) for what Mande does itself. */
export function ActivityAvatar({ actor, className }: { actor: ActivityActor; className?: string }) {
    if (actor.kind === "system") {
        return (
            <span
                className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50", className)}
            >
                <Leaf className="size-4 text-primary-600" strokeWidth={1.75} aria-hidden />
            </span>
        );
    }
    return <UserAvatar name={actor.name} src={actor.avatarUrl} className={cn("size-9 text-sm", className)} />;
}

/** The sentence, with the people, jobs and accounts it's about in bold. */
export function ActivityMessage({ message }: { message: PlatformActivity["message"] }) {
    return (
        <p className="text-sm font-text leading-snug text-mist-800">
            {message.map((part, index) =>
                typeof part === "string" ? (
                    part
                ) : (
                    <strong key={index} className="font-medium text-mist-950">
                        {part.strong}
                    </strong>
                ),
            )}
        </p>
    );
}
