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
