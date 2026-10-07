"use client";

import { useState } from "react";
import {
    ArrowUpRight,
    Award,
    ExternalLink,
    Loader2,
    Plus,
    Quote,
    Sparkles,
    Star,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "@/components/ui/userAvatar";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import { superAdminService } from "@/lib/services/superAdminService";
import type { CommunityPlatform, CommunityTestimonial } from "@/constant/community";
import type { CandidateJobReview } from "@/constant/superAdmin";
import { PLATFORMS } from "@/components/manufacturerPlatform/communityPage/platforms";

interface CommunityTestimonialsSectionProps {
    testimonials: (CommunityTestimonial & { order?: number; isActive?: boolean; jobId?: string | null })[];
    candidateReviews: CandidateJobReview[];
    onRefresh: () => void;
}

export default function CommunityTestimonialsSection({
    testimonials,
    candidateReviews,
    onRefresh,
}: CommunityTestimonialsSectionProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isCandidatesOpen, setIsCandidatesOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingOEmbed, setIsFetchingOEmbed] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [platform, setPlatform] = useState<CommunityPlatform>("whatsapp");
    const [name, setName] = useState("");
    const [business, setBusiness] = useState("");
    const [quote, setQuote] = useState("");
    const [rating, setRating] = useState(5);
    const [sourceUrl, setSourceUrl] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [verifiedMaker, setVerifiedMaker] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);
    const [tweetUrlInput, setTweetUrlInput] = useState("");

    const resetForm = () => {
        setPlatform("whatsapp");
        setName("");
        setBusiness("");
        setQuote("");
        setRating(5);
        setSourceUrl("");
        setAvatarUrl("");
        setVerifiedMaker(false);
        setIsFeatured(false);
        setTweetUrlInput("");
    };

    const handleFetchTweet = async () => {
        if (!tweetUrlInput) {
            toast.error("Please enter a valid Tweet or X URL.");
            return;
        }
        try {
            setIsFetchingOEmbed(true);
            const data = await superAdminService.fetchTweetOEmbed(tweetUrlInput);
            if (data.authorName) setName(data.authorName);
            if (data.quote) setQuote(data.quote);
            setPlatform("x");
            setSourceUrl(tweetUrlInput);
            toast.success("Tweet details imported!");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't fetch tweet details."));
        } finally {
            setIsFetchingOEmbed(false);
        }
    };

    const handleCreateTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quote.trim() || !name.trim() || !business.trim()) {
            toast.error("Please complete the required fields (Name, Workshop, Quote).");
            return;
        }

        try {
            setIsSubmitting(true);
            await superAdminService.createTestimonial({
                platform,
                name: name.trim(),
                business: business.trim(),
                quote: quote.trim(),
                rating,
                sourceUrl: sourceUrl.trim() || null,
                avatarUrl: avatarUrl.trim() || null,
                verifiedMaker,
                isFeatured,
            });
            toast.success("Community testimonial added.");
            setIsAddOpen(false);
            resetForm();
            onRefresh();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to create testimonial."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePromoteReview = async (jobId: string) => {
        try {
            await superAdminService.promoteJobReview(jobId);
            toast.success("Job sign-off review promoted to Community Testimonials!");
            setIsCandidatesOpen(false);
            onRefresh();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to promote review."));
        }
    };

    const handleToggleActive = async (id: string, currentState: boolean) => {
        try {
            await superAdminService.updateTestimonial(id, { isActive: !currentState });
            onRefresh();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to toggle status."));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this testimonial?")) return;
        try {
            setDeletingId(id);
            await superAdminService.deleteTestimonial(id);
            toast.success("Testimonial deleted.");
            onRefresh();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to delete testimonial."));
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
                <div>
                    <h3 className="text-base font-semibold font-text text-mist-950">
                        Community testimonials & reviews
                    </h3>
                    <p className="text-sm font-text text-mist-600">
                        Praise and quotes from WhatsApp, X, Instagram, LinkedIn, and real 5-star job sign-offs on Mande.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {candidateReviews.length > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCandidatesOpen(true)}
                            className="gap-2 text-xs font-medium font-text text-emerald-800 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100"
                        >
                            <Award className="size-3.5" />
                            Feature 5-star jobs ({candidateReviews.length})
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            resetForm();
                            setIsAddOpen(true);
                        }}
                        className="gap-2 bg-mist-900 text-white hover:bg-mist-800 text-xs font-medium font-text"
                    >
                        <Plus className="size-3.5" />
                        Add testimonial
                    </Button>
                </div>
            </div>

            {testimonials.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border text-center">
                    <Quote className="size-8 text-mist-400 mb-2" />
                    <p className="text-sm font-medium font-text text-mist-900">No testimonials yet</p>
                    <p className="text-xs font-text text-mist-500 max-w-sm mt-1">
                        Add quotes from maker channels or promote genuine 5-star job feedback from the factory.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {testimonials.map((t) => {
                        const platformConfig = PLATFORMS[t.platform] ?? PLATFORMS.mande;
                        const { name, Icon, badgeClass } = platformConfig;
                        const isMande = t.platform === "mande";

                        return (
                            <div
                                key={t.id}
                                className={cn(
                                    "flex flex-col justify-between gap-4 rounded-xl border p-5 transition-shadow",
                                    t.isActive === false ? "opacity-60 bg-mist-50 border-border" : "bg-white border-border shadow-xs"
                                )}
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 text-amber-500">
                                            {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                                                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-medium font-text text-mist-600">
                                            <span
                                                className={cn(
                                                    "flex size-4.5 items-center justify-center rounded-full text-white",
                                                    badgeClass
                                                )}
                                            >
                                                <Icon className="size-2.5" />
                                            </span>
                                            {isMande ? "Verified Maker" : `on ${name}`}
                                        </span>
                                    </div>

                                    <blockquote className="text-xs leading-5 font-text text-mist-800 line-clamp-4">
                                        &ldquo;{t.quote}&rdquo;
                                    </blockquote>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-border pt-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <UserAvatar name={t.name} src={t.avatarUrl ?? undefined} className="size-8 text-[11px] shrink-0" />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-semibold font-text text-mist-950 truncate">{t.name}</p>
                                                    {t.verifiedMaker && (
                                                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-medium border border-emerald-200">
                                                            Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-text text-mist-500 truncate">{t.business}</p>
                                            </div>
                                        </div>

                                        {t.sourceUrl && (
                                            <a
                                                href={t.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-mist-400 hover:text-mist-700 shrink-0"
                                            >
                                                <ArrowUpRight className="size-3.5" />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-text text-mist-600">
                                            <Switch
                                                checked={t.isActive !== false}
                                                onCheckedChange={() => handleToggleActive(t.id, t.isActive !== false)}
                                                aria-label="Toggle visible"
                                            />
                                            <span>{t.isActive !== false ? "Visible" : "Hidden"}</span>
                                        </label>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(t.id)}
                                            disabled={deletingId === t.id}
                                            className="size-7 p-0 text-mist-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Testimonial Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-lg">
                    <div className="flex flex-col gap-1.5">
                        <DialogTitle className="text-base font-semibold font-text">
                            Add community testimonial
                        </DialogTitle>
                        <DialogDescription className="text-xs font-text text-mist-600">
                            Enter praise from social media or import a tweet directly by URL.
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleCreateTestimonial} className="flex flex-col gap-4 py-2">
                        {/* Tweet fast import */}
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-mist-50 border border-border">
                            <label className="text-xs font-medium font-text text-mist-800 flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-secondary-500" />
                                Fast-import from X (Twitter) URL
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={tweetUrlInput}
                                    onChange={(e) => setTweetUrlInput(e.target.value)}
                                    placeholder="https://x.com/username/status/..."
                                    className="text-xs font-text bg-white"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFetchTweet}
                                    disabled={isFetchingOEmbed}
                                    className="text-xs shrink-0"
                                >
                                    {isFetchingOEmbed ? <Loader2 className="size-3 animate-spin" /> : "Import"}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium font-text text-mist-700">Platform</label>
                                <select
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value as CommunityPlatform)}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs font-text shadow-xs outline-none"
                                >
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="x">X (Twitter)</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="telegram">Telegram</option>
                                    <option value="mande">Mande (Verified Review)</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium font-text text-mist-700">Rating (Stars)</label>
                                <select
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs font-text shadow-xs outline-none"
                                >
                                    <option value={5}>5 Stars ★★★★★</option>
                                    <option value={4}>4 Stars ★★★★☆</option>
                                    <option value={3}>3 Stars ★★★☆☆</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium font-text text-mist-700">Author Name *</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Chidi Okafor"
                                    required
                                    className="text-xs font-text"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium font-text text-mist-700">Workshop / Business *</label>
                                <Input
                                    value={business}
                                    onChange={(e) => setBusiness(e.target.value)}
                                    placeholder="Okafor Woodworks"
                                    required
                                    className="text-xs font-text"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium font-text text-mist-700">Testimonial Quote *</label>
                            <Textarea
                                value={quote}
                                onChange={(e) => setQuote(e.target.value)}
                                placeholder="What they said about working with Mande..."
                                rows={3}
                                required
                                className="text-xs font-text resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium font-text text-mist-700">Avatar Image URL (Optional)</label>
                                <Input
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://.../avatar.jpg"
                                    className="text-xs font-text"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium font-text text-mist-700">Original Post URL (Optional)</label>
                                <Input
                                    value={sourceUrl}
                                    onChange={(e) => setSourceUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="text-xs font-text"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-text text-mist-700">
                                <input
                                    type="checkbox"
                                    checked={verifiedMaker}
                                    onChange={(e) => setVerifiedMaker(e.target.checked)}
                                    className="accent-mist-900 rounded size-4"
                                />
                                <span>Verified Mande Maker badge</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-text text-mist-700">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="accent-mist-900 rounded size-4"
                                />
                                <span>Highlight as featured</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddOpen(false)}
                                className="text-xs font-text"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                                className="bg-mist-900 text-white hover:bg-mist-800 text-xs font-text gap-2"
                            >
                                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                                Add testimonial
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Promote 5-Star Job Reviews Dialog */}
            <Dialog open={isCandidatesOpen} onOpenChange={setIsCandidatesOpen}>
                <DialogContent className="max-w-2xl">
                    <div className="flex flex-col gap-1.5">
                        <DialogTitle className="text-base font-semibold font-text flex items-center gap-2">
                            <Award className="size-5 text-amber-500" />
                            Genuine 5-Star Reviews from Completed Jobs
                        </DialogTitle>
                        <DialogDescription className="text-xs font-text text-mist-600">
                            These reviews were submitted by makers and project leads upon job sign-off. Feature them as verified testimonials with one click.
                        </DialogDescription>
                    </div>

                    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto py-2">
                        {candidateReviews.map((candidate) => (
                            <div
                                key={candidate.jobId}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-mist-50/50 hover:bg-mist-50 transition-colors"
                            >
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold font-text text-mist-950 truncate">
                                            {candidate.authorName}
                                        </span>
                                        <span className="text-xs font-text text-mist-500">· {candidate.business}</span>
                                        <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                            5.0 ★
                                        </span>
                                    </div>
                                    <p className="text-xs text-mist-500 font-text">Job: {candidate.jobTitle}</p>
                                    <p className="text-xs text-mist-800 font-text italic mt-1 line-clamp-2">
                                        &ldquo;{candidate.quote}&rdquo;
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handlePromoteReview(candidate.jobId)}
                                    className="shrink-0 bg-mist-900 text-white hover:bg-mist-800 text-xs font-text gap-1.5"
                                >
                                    <Sparkles className="size-3" />
                                    Feature on community
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
