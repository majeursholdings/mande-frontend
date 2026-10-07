export type SocialIconProps = {
    className?: string;
};

export function GoogleIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path
                fill="#FFC107"
                d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.1-5.1C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
            />
            <path
                fill="#FF3D00"
                d="m6.3 14.7 5.9 4.3C13.9 15.3 18.6 12 24 12c3.1 0 5.8 1.1 8 3l5.1-5.1C33.6 6.1 29 4 24 4c-7.5 0-13.9 4.2-17.2 10.4z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5 0 9.5-1.9 12.9-5l-6-5c-1.7 1.2-4 2.2-6.9 2.2-5.3 0-9.7-3.4-11.3-8.1l-5.9 4.5C9.9 39.6 16.4 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4-4.1 5.3l6 5C40.7 34.7 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"
            />
        </svg>
    );
}

export function FacebookIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                fill="#1877F2"
                d="M24 12.07C24 5.4 18.6 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8v8.44C19.61 23.09 24 18.09 24 12.07"
            />
        </svg>
    );
}

// ─── Community platform glyphs ───────────────────────────────────────────────
// Simplified single-colour marks (they take `currentColor`), sized for the
// brand-coloured badges on the community page. Swap for the platforms'
// official brand assets if needed.

export function WhatsAppIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path
                d="M12 3.5a8.5 8.5 0 0 0-7.36 12.75L3.5 20.5l4.35-1.12A8.5 8.5 0 1 0 12 3.5z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            <path
                d="M9.2 8.2c.2-.4.4-.4.6-.4h.4c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.2-.1.3 0 .5.5.9 1.2 1.6 2.1 2.1.2.1.3.1.5 0l.6-.5c.2-.1.4-.2.6-.1l1.7.7c.3.1.4.3.4.5v.4c0 .2 0 .4-.4.6-.5.3-1.1.5-1.7.4-1.2-.2-2.5-.9-3.6-2s-1.8-2.4-2-3.6c-.1-.6.1-1.2.4-1.7z"
                fill="currentColor"
            />
        </svg>
    );
}

export function TikTokIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                d="M14.5 3h2.8c.2 1.9 1.6 3.3 3.4 3.5v2.9c-1.3 0-2.5-.4-3.4-1v6.1a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3a2.6 2.6 0 1 0 1.8 2.4z"
                fill="currentColor"
            />
        </svg>
    );
}

export function InstagramIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.9" />
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.9" />
            <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
        </svg>
    );
}

export function LinkedInIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <rect x="4" y="9.5" width="3.2" height="10" rx="0.4" />
            <circle cx="5.6" cy="5.8" r="1.9" />
            <path d="M10 9.5h3.1v1.4c.5-.9 1.7-1.7 3.4-1.7 2.9 0 3.5 1.9 3.5 4.4v5.9h-3.2v-5.2c0-1.3-.3-2.4-1.6-2.4-1.4 0-2 1-2 2.4v5.2H10z" />
        </svg>
    );
}

export function XIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <path d="M4 4h4.2L20 20h-4.2z" fill="currentColor" />
            <path d="M19.6 4.2 4.4 19.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

export function YouTubeIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                fillRule="evenodd"
                fill="currentColor"
                d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 9v6l5.2-3z"
            />
        </svg>
    );
}

/** A single-colour Facebook "f" — FacebookIcon above is the full-colour logo. */
export function FacebookGlyphIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                d="M13.4 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3h2.6V21z"
                fill="currentColor"
            />
        </svg>
    );
}

export function TelegramIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path
                d="m21.6 3.6-3.3 16.5c-.2 1.1-.9 1.4-1.8.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.2l-11.7 7.4-5-1.6c-1.1-.3-1.1-1.1.2-1.6l19.5-7.5c.9-.3 1.7.3 1.4 1.2z"
                fill="currentColor"
            />
        </svg>
    );
}

export function MandeBadgeIcon({ className }: SocialIconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <rect width="24" height="24" rx="6" fill="currentColor" />
            <path
                d="M7 12.5L10.5 16L17 8.5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
