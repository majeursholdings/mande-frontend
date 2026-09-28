// The website's pages
export const OPEN_JOBS_URL = "/open-jobs";
export const ABOUT_URL = "/about-mande";
export const SERVICES_URL = "/mande-services";
export const COMMUNITY_URL = "/community";
export const CONTACT_URL = "/contact-mande";
export const FAQ_URL = "/faq";
export const LEGALS_URL = "/legals";
export const TERMS_URL = "/terms-and-conditions";
export const PRIVACY_POLICY_URL = "/privacy-policy";

/**
 * Where a legal document lives on the website — the terms and privacy policy
 * at their own addresses (sign-up and the contact form link to them), the
 * rest under /legals.
 */
export function getLegalDocumentUrl(slug: string): string {
    if (slug === "terms-and-conditions") return TERMS_URL;
    if (slug === "privacy-policy") return PRIVACY_POLICY_URL;
    return `${LEGALS_URL}/${slug}`;
}

// Kept free of imports (icons and the like): next.config.ts reads this file.
type Mainmenu = {
    label: string;
    href?: string;
    /** A line under the label, in the header's dropdown. */
    description?: string;
    subMenu?: Mainmenu[];
}

export const mainmenu:Mainmenu[] = [
    {
        label: "Home",
        href: "/",
    },
    {
        label: "Open Jobs",
        href: OPEN_JOBS_URL,
    },
    {
        label: "Services",
        href: SERVICES_URL,
    },
    {
        label: "Community",
        href: COMMUNITY_URL,
    },
    {
        label: "Help Center",
        subMenu: [
            {
                label: "Contact",
                href: CONTACT_URL,
                description: "Talk to the MANDE team",
            },
            {
                label: "Frequently Asked Questions",
                href: FAQ_URL,
                description: "Jobs, payments, plans and your account",
            },
        ],
    },
    {
        label: "About",
        href: ABOUT_URL,
    },
]

export const footerMenu: Mainmenu[] = [
    {
        label: "About",
        href: ABOUT_URL,
    },
    {
        label: "Services",
        href: SERVICES_URL,
    },
    {
        label: "Community",
        href: COMMUNITY_URL,
    },
    {
        label: "Contact",
        href: CONTACT_URL,
    },
    {
        label: "FAQs",
        href: FAQ_URL,
    },
    {
        label: "Terms",
        href: TERMS_URL,
    },
    {
        label: "Privacy",
        href: PRIVACY_POLICY_URL,
    },
    {
        label: "Legals",
        href: LEGALS_URL,
    },
];

/** The Mande website's homepage — where the sign-in screens' logo goes. */
export const MANDE_WEBSITE_URL = "/";

export const ARTISAN_LOGIN_URL = "/manufacturer/login";
export const ARTISAN_SIGNUP_URL = "/manufacturer/registration";
export const ARTISAN_FORGOT_PASSWORD_URL = "/manufacturer/forgot-password";

export const ADMIN_LOGIN_URL = "/admin/login"
export const ADMIN_SIGNUP_URL = "/admin/sign-up"
export const ADMIN_FORGOT_PASSWORD_URL = "/admin/forgot-password"

export const SUPER_ADMIN_LOGIN_URL = "/super-admin/login";
export const SUPER_ADMIN_SIGNUP_URL = "/super-admin/sign-up";
export const SUPER_ADMIN_FORGOT_PASSWORD_URL = "/super-admin/forgot-password";
export const SUPER_ADMIN_DASHBOARD_URL = "/super-admin/dashboard";
    