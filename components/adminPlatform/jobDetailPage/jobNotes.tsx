"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { formatDayAndTime } from "@/lib/date";
import UserAvatar from "@/components/ui/userAvatar";
import type { AdminJobNote } from "@/constant/admin";
import JobNoteForm from "@/components/adminPlatform/form/jobNoteForm";
import { DetailSection } from "./detailParts";

const VISIBLE_NOTES = 4;

/**
 * Notes, comments and feedback on the job — from its project lead and the
 * manufacturer, newest first. Not a chat: a running record the lead adds to,
 * closed once the job is completed.
 */
export default function JobNotes({
    notes,
    canPost,
    info,
    onPost,
}: {
    notes: AdminJobNote[];
    canPost: boolean;
    /** The line under the heading — who can see or add notes. */
    info: string;
    onPost: (message: string) => void | Promise<void>;
}) {
    const [showOlder, setShowOlder] = useState(false);
    const visibleNotes = showOlder ? notes : notes.slice(0, VISIBLE_NOTES);

    return (
        <DetailSection title="Notes">
            <p className="-mt-2 flex items-start gap-1.5 text-xs font-text text-mist-500">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                {info}
            </p>

            {canPost && <JobNoteForm onPost={onPost} />}

            {notes.length === 0 ? (
                <p className="rounded-lg bg-mist-50 px-5 py-6 text-center text-sm font-text text-mist-500">No notes yet.</p>
            ) : (
                <div className="flex flex-col gap-6 rounded-lg bg-mist-50 px-4 py-5 sm:px-5">
                    <ul className="flex flex-col gap-6">
                        {visibleNotes.map((note) => (
                            <li key={note.id} className="flex gap-3">
                                <UserAvatar name={note.authorName} className="size-8 text-xs" />
                                <div className="flex min-w-0 flex-col gap-2">
                                    <div>
                                        <p className="text-sm font-medium font-text text-mist-950">
                                            {note.authorName}{" "}
                                            <span className="font-normal text-mist-400">· {note.authorRole}</span>
                                        </p>
                                        <p className="text-xs font-text text-mist-400">
                                            {formatDayAndTime(new Date(note.createdAt))}
                                        </p>
                                    </div>
                                    <p className="text-sm font-text whitespace-pre-line text-mist-800">{note.message}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {notes.length > VISIBLE_NOTES && (
                        <button
                            type="button"
                            onClick={() => setShowOlder((shown) => !shown)}
                            className="self-center text-xs font-medium font-text text-error-600 hover:underline cursor-pointer"
                        >
                            {showOlder ? "Hide older notes" : `View older notes (${notes.length - VISIBLE_NOTES})`}
                        </button>
                    )}
                </div>
            )}
        </DetailSection>
    );
}
