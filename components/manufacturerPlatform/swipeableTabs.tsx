"use client";

import {
    useCallback,
    useRef,
    useState,
    type KeyboardEvent,
    type ReactNode,
    type UIEvent,
} from "react";
import { cn } from "@/lib/utils";

export type SwipeableTab<T extends string> = {
    value: T;
    label: string;
    panel: ReactNode;
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─────────────────────────────────────────────────────────────────────────────
// SwipeableTabs — tabs in the style of X's (Twitter's) home timeline:
// equal-width labels over a full-width divider, with a short bar under the
// active one. On phones the row sticks under the top bar and the panels sit
// side by side in a scroll-snap strip, so they can be swiped between: the bar
// follows the swipe, and the tab switches once the next panel is more than
// halfway in. From md up it's a plain tab row showing only the active panel.
// Follows the WAI-ARIA tabs pattern (Left/Right, Home/End).
// ─────────────────────────────────────────────────────────────────────────────

export default function SwipeableTabs<T extends string>({
    tabs,
    initialValue,
    onChange,
    label,
    idPrefix,
}: {
    tabs: SwipeableTab<T>[];
    initialValue: T;
    onChange?: (value: T) => void;
    /** Names the tab row for screen readers. */
    label: string;
    /** Starts the tab and panel ids — unique on the page. */
    idPrefix: string;
}) {
    const initialIndex = Math.max(
        0,
        tabs.findIndex((tab) => tab.value === initialValue),
    );
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    // Only read when the bar and strip first mount
    const initialIndexRef = useRef(initialIndex);
    const tabListRef = useRef<HTMLDivElement | null>(null);
    const barRef = useRef<HTMLSpanElement | null>(null);
    const stripRef = useRef<HTMLDivElement | null>(null);
    // Set while a tapped tab's panel scrolls into view, so the tabs it passes
    // on the way don't flash active
    const scrollTargetRef = useRef<number | null>(null);
    // The active tab when a swipe started, to tell a real switch from a nudge
    const swipeStartIndexRef = useRef<number | null>(null);

    const tabId = (index: number) => `${idPrefix}-tab-${tabs[index].value}`;
    const panelId = (index: number) => `${idPrefix}-panel-${tabs[index].value}`;

    // Fractional mid-swipe — 0.5 is halfway between the first two tabs
    const moveBar = (position: number) => {
        if (barRef.current) barRef.current.style.transform = `translateX(${position * 100}%)`;
    };

    const attachBar = useCallback((node: HTMLSpanElement | null) => {
        barRef.current = node;
        if (node) node.style.transform = `translateX(${initialIndexRef.current * 100}%)`;
    }, []);

    const attachStrip = useCallback((node: HTMLDivElement | null) => {
        stripRef.current = node;
        // Phones: start on the initial tab's panel (from md up the strip doesn't scroll)
        if (node) node.scrollLeft = initialIndexRef.current * node.clientWidth;
    }, []);

    const changeTab = (index: number) => {
        setActiveIndex(index);
        onChange?.(tabs[index].value);
    };

    // If the page is scrolled past the top of the panels, scroll back up so
    // the newly shown panel starts right under the (stuck) tab row
    const revealPanelTop = () => {
        const strip = stripRef.current;
        const tabList = tabListRef.current;
        if (!strip || !tabList) return;
        const tabsBottom = tabList.getBoundingClientRect().bottom;
        if (strip.getBoundingClientRect().top >= tabsBottom) return;
        strip.style.scrollMarginTop = `${tabsBottom}px`;
        strip.scrollIntoView({ block: "start" });
    };

    const selectTab = (index: number) => {
        if (index !== activeIndex) changeTab(index);
        const strip = stripRef.current;
        if (!strip || strip.scrollWidth <= strip.clientWidth) {
            moveBar(index);
            return;
        }
        // Phones: scroll the strip — its scroll handler moves the bar along
        revealPanelTop();
        if (Math.round(strip.scrollLeft / strip.clientWidth) === index) return;
        scrollTargetRef.current = index;
        strip.scrollTo({
            left: index * strip.clientWidth,
            behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
    };

    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        const strip = event.currentTarget;
        const position = strip.scrollLeft / strip.clientWidth;
        moveBar(position);

        const target = scrollTargetRef.current;
        if (target !== null) {
            if (Math.abs(position - target) < 0.01) scrollTargetRef.current = null;
            return;
        }
        const index = Math.round(position);
        if (index !== activeIndex && tabs[index]) changeTab(index);
    };

    const handleSwipeStart = () => {
        // A swipe takes over from a tapped tab's scroll
        scrollTargetRef.current = null;
        swipeStartIndexRef.current = activeIndex;
    };

    const handleScrollEnd = () => {
        const startIndex = swipeStartIndexRef.current;
        swipeStartIndexRef.current = null;
        if (startIndex !== null && startIndex !== activeIndex) revealPanelTop();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const nextIndex =
            event.key === "ArrowRight"
                ? (activeIndex + 1) % tabs.length
                : event.key === "ArrowLeft"
                  ? (activeIndex - 1 + tabs.length) % tabs.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? tabs.length - 1
                      : null;
        if (nextIndex === null) return;
        event.preventDefault();
        selectTab(nextIndex);
        document.getElementById(tabId(nextIndex))?.focus();
    };

    return (
        <div className="flex flex-col">
            <div
                ref={tabListRef}
                role="tablist"
                aria-label={label}
                onKeyDown={handleKeyDown}
                // Phones: edge to edge, stuck under the 57px-tall mobile top bar
                className="sticky top-[57px] z-20 -mx-4 border-b border-border bg-white/90 backdrop-blur-md md:static md:mx-0 md:bg-transparent md:backdrop-blur-none"
            >
                <div className="relative flex md:max-w-sm">
                    {tabs.map((tab, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <button
                                key={tab.value}
                                id={tabId(index)}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={panelId(index)}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => selectTab(index)}
                                className={cn(
                                    "flex-1 py-4 text-[15px] font-text outline-none transition-colors cursor-pointer hover:bg-mist-100/70 focus-visible:bg-mist-100",
                                    isActive ? "font-bold text-mist-950" : "font-medium text-mist-500",
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                    <span
                        ref={attachBar}
                        aria-hidden
                        className="pointer-events-none absolute bottom-0 left-0 flex justify-center md:transition-transform md:duration-300"
                        style={{ width: `${100 / tabs.length}%` }}
                    >
                        <span className="h-1 w-14 rounded-full bg-secondary-700" />
                    </span>
                </div>
            </div>

            <div
                ref={attachStrip}
                onScroll={handleScroll}
                onScrollEnd={handleScrollEnd}
                onTouchStart={handleSwipeStart}
                className="-mx-4 flex snap-x snap-mandatory items-start overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:block md:overflow-visible"
            >
                {tabs.map((tab, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <div
                            key={tab.value}
                            id={panelId(index)}
                            role="tabpanel"
                            aria-labelledby={tabId(index)}
                            // Off-screen panels stay out of the tab order
                            inert={!isActive}
                            className={cn(
                                "w-full shrink-0 snap-start snap-always px-4 pt-4 md:px-0 md:pt-6",
                                // Capped so a long hidden panel doesn't stretch the page under a short one
                                !isActive && "max-h-dvh overflow-hidden md:hidden",
                            )}
                        >
                            {tab.panel}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
