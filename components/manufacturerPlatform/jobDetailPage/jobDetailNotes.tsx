"use client";

import { MessageSquare } from "lucide-react";
import UserAvatar from "@/components/ui/userAvatar";
import JobNoteForm from "@/components/manufacturerPlatform/form/jobNoteForm";
import { formatDayAndTime, getRelativeTimeLabel } from "@/lib/date";
import type { JobNote } from "@/constant/manufacturer";

type JobDetailNotesProps = {
    /** Oldest first. */
    notes: JobNote[];
    /** Whether they can post one: only while the job is theirs (the API refuses otherwise). */
    canAddNote: boolean;
    addNote: (message: string) => Promise<void>;
};

function NoteItem({ note }: { note: JobNote }) {
    const postedAt = note.createdAt ? new Date(note.createdAt) : null;
    return (
        <li className="flex gap-3">
            <UserAvatar name={note.authorName} className="size-7 shrink-0 text-[10px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium font-text text-mist-950">{note.authorName}</span>
                    {note.roleLabel && <span className="text-xs font-text text-mist-500">{note.roleLabel}</span>}
                    {postedAt && (
                        <time
                            dateTime={note.createdAt ?? undefined}
                            title={formatDayAndTime(postedAt)}
                            className="ml-auto text-xs font-text text-mist-400"
                        >
                            {getRelativeTimeLabel(postedAt)}
                        </time>
                    )}
                </div>
                <p className="whitespace-pre-wrap break-words rounded-lg bg-mist-50 px-3 py-2 text-sm font-text text-mist-700">
                    {note.message}
                </p>
            </div>
        </li>
    );
}

/** The job's notes thread with its project lead, and a box to add one while the job is theirs. */
export default function JobDetailNotes({ notes, canAddNote, addNote }: JobDetailNotesProps) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold font-text text-mist-950">
                Notes{notes.length > 0 ? ` (${notes.length})` : ""}
            </h3>

            {notes.length > 0 ? (
                <ul className="flex flex-col gap-4">
                    {notes.map((note) => (
                        <NoteItem key={note.id} note={note} />
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center">
                    <MessageSquare className="size-5 text-mist-400" />
                    <p className="text-sm font-medium font-text text-mist-900">No notes yet</p>
                    <p className="text-xs font-text text-mist-500">
                        {canAddNote
                            ? "Notes you and your project lead leave on this job show up here."
                            : "Notes left on this job show up here."}
                    </p>
                </div>
            )}

            {canAddNote && <JobNoteForm addNote={addNote} />}
        </section>
    );
}
