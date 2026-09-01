"use client";

import { cn } from "@/lib/utils";
import {
    Loader2,
    Maximize,
    Minimize,
    Pause,
    Play,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

type VideoPlayerProps = {
    src: string;
    poster?: string;
    className?: string;
};

const SKIP_SECONDS = 10;
const CONTROLS_HIDE_DELAY = 2500;

function formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrubbingRef = useRef(false);

    const [hasStarted, setHasStarted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);

    const clearHideTimeout = useCallback(() => {
        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
            hideControlsTimeout.current = null;
        }
    }, []);

    const scheduleHideControls = useCallback(() => {
        clearHideTimeout();
        hideControlsTimeout.current = setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) {
                setShowControls(false);
            }
        }, CONTROLS_HIDE_DELAY);
    }, [clearHideTimeout]);

    const revealControls = useCallback(() => {
        setShowControls(true);
        scheduleHideControls();
    }, [scheduleHideControls]);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }, []);

    const skip = useCallback((amount: number) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration)) return;
        video.currentTime = Math.min(
            Math.max(video.currentTime + amount, 0),
            video.duration
        );
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
    }, []);

    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, []);

    const seekToRatio = useCallback((ratio: number) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration)) return;
        video.currentTime = Math.min(Math.max(ratio, 0), 1) * video.duration;
    }, []);

    const handleTrackPointer = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const track = e.currentTarget;
            const rect = track.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seekToRatio(ratio);
        },
        [seekToRatio]
    );

    const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        scrubbingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        handleTrackPointer(e);
    };

    const onTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!scrubbingRef.current) return;
        handleTrackPointer(e);
    };

    const onTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        scrubbingRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            togglePlay();
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            skip(SKIP_SECONDS);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            skip(-SKIP_SECONDS);
        }
    };

    const setVideoRef = useCallback(
        (node: HTMLVideoElement | null) => {
            videoRef.current = node;
            if (!node) return;

            const onLoadedMetadata = () => {
                setDuration(node.duration);
                if (!poster) {
                    node.currentTime = 0.01;
                }
            };
            const onTimeUpdate = () => setCurrentTime(node.currentTime);
            const onProgress = () => {
                if (node.buffered.length > 0) {
                    setBuffered(node.buffered.end(node.buffered.length - 1));
                }
            };
            const onPlay = () => {
                setIsPlaying(true);
                setHasStarted(true);
                scheduleHideControls();
            };
            const onPause = () => {
                setIsPlaying(false);
                setShowControls(true);
                clearHideTimeout();
            };
            const onEnded = () => {
                setIsPlaying(false);
                setShowControls(true);
            };
            const onWaiting = () => setIsLoading(true);
            const onCanPlay = () => setIsLoading(false);
            const onVolumeChange = () => setIsMuted(node.muted);

            node.addEventListener("loadedmetadata", onLoadedMetadata);
            node.addEventListener("timeupdate", onTimeUpdate);
            node.addEventListener("progress", onProgress);
            node.addEventListener("play", onPlay);
            node.addEventListener("pause", onPause);
            node.addEventListener("ended", onEnded);
            node.addEventListener("waiting", onWaiting);
            node.addEventListener("canplay", onCanPlay);
            node.addEventListener("volumechange", onVolumeChange);

            return () => {
                node.removeEventListener("loadedmetadata", onLoadedMetadata);
                node.removeEventListener("timeupdate", onTimeUpdate);
                node.removeEventListener("progress", onProgress);
                node.removeEventListener("play", onPlay);
                node.removeEventListener("pause", onPause);
                node.removeEventListener("ended", onEnded);
                node.removeEventListener("waiting", onWaiting);
                node.removeEventListener("canplay", onCanPlay);
                node.removeEventListener("volumechange", onVolumeChange);
            };
        },
        [poster, scheduleHideControls, clearHideTimeout]
    );

    const setContainerRef = useCallback(
        (node: HTMLDivElement | null) => {
            containerRef.current = node;
            if (!node) return;

            const onFullscreenChange = () => {
                setIsFullscreen(document.fullscreenElement === node);
            };
            document.addEventListener("fullscreenchange", onFullscreenChange);

            return () => {
                document.removeEventListener("fullscreenchange", onFullscreenChange);
                clearHideTimeout();
            };
        },
        [clearHideTimeout]
    );

    const playedRatio = duration > 0 ? currentTime / duration : 0;
    const bufferedRatio = duration > 0 ? buffered / duration : 0;

    return (
        <div
            ref={setContainerRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseMove={revealControls}
            onMouseLeave={() => {
                if (isPlaying) setShowControls(false);
            }}
            className={cn(
                "relative rounded-[10px] overflow-hidden bg-primary-950 outline-none group/player",
                className,
            )}
        >
            <video
                ref={setVideoRef}
                src={src}
                poster={poster}
                preload="metadata"
                playsInline
                onClick={togglePlay}
                className="w-full h-full object-contain object-center cursor-pointer"
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <Loader2 className="size-8 text-white animate-spin" />
                </div>
            )}

            {!hasStarted && !isLoading && (
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label="Play video"
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-300"
                >
                    <span className="flex items-center justify-center size-16 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors duration-300">
                        <Play className="size-7 text-white fill-white ml-1" />
                    </span>
                </button>
            )}

            <div
                className={cn(
                    "absolute inset-x-0 bottom-0 flex flex-col gap-2 px-3 pb-2.5 pt-6 bg-linear-to-t from-black/70 to-transparent transition-opacity duration-300",
                    showControls || !isPlaying
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none",
                )}
            >
                <div
                    onPointerDown={onTrackPointerDown}
                    onPointerMove={onTrackPointerMove}
                    onPointerUp={onTrackPointerUp}
                    className="relative h-1.5 w-full rounded-full bg-white/25 cursor-pointer touch-none"
                >
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-white/40"
                        style={{ width: `${bufferedRatio * 100}%` }}
                    />
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary-500"
                        style={{ width: `${playedRatio * 100}%` }}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full bg-primary-500"
                        style={{ left: `${playedRatio * 100}%` }}
                    />
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={isPlaying ? "Pause" : "Play"}
                            className="p-1.5 rounded-full text-white hover:bg-white/15 transition-colors duration-300"
                        >
                            {isPlaying ? (
                                <Pause className="size-4 fill-white" />
                            ) : (
                                <Play className="size-4 fill-white" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => skip(-SKIP_SECONDS)}
                            aria-label="Rewind 10 seconds"
                            className="p-1.5 rounded-full text-white hover:bg-white/15 transition-colors duration-300"
                        >
                            <SkipBack className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => skip(SKIP_SECONDS)}
                            aria-label="Forward 10 seconds"
                            className="p-1.5 rounded-full text-white hover:bg-white/15 transition-colors duration-300"
                        >
                            <SkipForward className="size-4" />
                        </button>
                        <span className="text-xs text-white/80 tabular-nums select-none">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={toggleMute}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                            className="p-1.5 rounded-full text-white hover:bg-white/15 transition-colors duration-300"
                        >
                            {isMuted ? (
                                <VolumeX className="size-4" />
                            ) : (
                                <Volume2 className="size-4" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={
                                isFullscreen
                                    ? "Exit fullscreen"
                                    : "Enter fullscreen"
                            }
                            className="p-1.5 rounded-full text-white hover:bg-white/15 transition-colors duration-300"
                        >
                            {isFullscreen ? (
                                <Minimize className="size-4" />
                            ) : (
                                <Maximize className="size-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { VideoPlayer };
