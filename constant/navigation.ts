// The website's pages
export const OPEN_JOBS_URL = "/open-jobs";
export const ABOUT_URL = "/about-mande";
export const SERVICES_URL = "/mande-services";
/** The factory's machine catalogue; each machine has its own page under it. */
export const MACHINES_URL = "/machines";
/** The section id of the MANDE Accelerator Program's panel on the Services page. */
export const ACCELERATOR_SECTION_ID = "accelerator";
/** The MANDE Accelerator Program's own page: its loans and who can apply. */
export const ACCELERATOR_URL = "/accelerator-program";
export const COMMUNITY_URL = "/community";
/** The shop's name, as shown on the website. */
export const SHOP_NAME = "MANDE Furniture shop";
/** The shop, a separate site where anyone can buy everyday furniture (stools, armchairs, beds). */
export const SHOP_URL = "https://shop.mande.com.ng";
export const CONTACT_URL = "/contact-mande";
export const FAQ_URL = "/faq";
export const LEGALS_URL = "/legals";
export const KNOWLEDGE_BASE_URL = "/knowledge-base";
export const BLOG_URL = "/blog";
export const TERMS_URL = "/terms-and-conditions";
export const PRIVACY_POLICY_URL = "/privacy-policy";
/** A guest's machine bookings, looked up by email and a code. */
export const MACHINE_BOOKING_MY_BOOKINGS_URL = "/machine-booking/my-bookings";
/** One machine booking, from the private link in a booking email (?token=). */
export const MACHINE_BOOKING_VIEW_URL = "/machine-booking/view";

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
    /** Another site (the shop): opens in a new tab, marked with an arrow. */
    external?: boolean;
    subMenu?: Mainmenu[];
}

// Most important first: the work, what MANDE offers, then who we are and
// where to get help
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
        subMenu: [
            {
                label: "All services",
                href: SERVICES_URL,
                description: "Jobs, machines and funding in one place",
            },
            {
                label: "Machines",
                href: MACHINES_URL,
                description: "Book time at our Lagos factory",
            },
            {
                label: "Accelerator loans",
                href: ACCELERATOR_URL,
                description: "Loans for makers who rank high",
            },
            {
                label: "Community",
                href: COMMUNITY_URL,
                description: "Job alerts and tips from other makers",
            },
        ],
    },
    {
        label: "About",
        href: ABOUT_URL,
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
            {
                label: "Knowledge Base",
                href: KNOWLEDGE_BASE_URL,
                description: "Step-by-step guides to using MANDE",
            },
        ],
    },
    {
        label: "Blog",
        href: BLOG_URL,
    },
]

/** The footer's link columns, each under a heading. The legal pages sit in the bottom bar (footerLegalMenu). */
export const footerMenu: { title: string; links: Mainmenu[] }[] = [
    {
        title: "For makers",
        links: [
            { label: "Open jobs", href: OPEN_JOBS_URL },
            { label: "Machines", href: MACHINES_URL },
            { label: "Accelerator loans", href: ACCELERATOR_URL },
            { label: "Community", href: COMMUNITY_URL },
            { label: "My machine bookings", href: MACHINE_BOOKING_MY_BOOKINGS_URL },
        ],
    },
    {
        title: "MANDE",
        links: [
            { label: "About", href: ABOUT_URL },
            { label: "Services", href: SERVICES_URL },
            { label: SHOP_NAME, href: SHOP_URL, external: true },
            { label: "Blog", href: BLOG_URL },
        ],
    },
    {
        title: "Help",
        links: [
            { label: "Contact us", href: CONTACT_URL },
            { label: "FAQs", href: FAQ_URL },
            { label: "Knowledge base", href: KNOWLEDGE_BASE_URL },
        ],
    },
];

export const footerLegalMenu: Mainmenu[] = [
    { label: "Terms", href: TERMS_URL },
    { label: "Privacy", href: PRIVACY_POLICY_URL },
    { label: "Legals", href: LEGALS_URL },
];

/**
 * Whether a menu link points at the page you're on: the page itself or one
 * under it ("/machines/abc" for Machines). A link to a section of a page
 * (with a "#") is never marked, so the page's own link carries it.
 */
export function isMenuHrefActive(href: string | undefined, pathname: string): boolean {
    if (!href || href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

/** A help article's page. */
export const getKnowledgeBaseArticleUrl = (slug: string) => `${KNOWLEDGE_BASE_URL}/${slug}`;

/** A machine's page in the catalogue. */
export const getMachineUrl = (machineId: string) => `${MACHINES_URL}/${encodeURIComponent(machineId)}`;

/** The machine catalogue, filtered to one category when there is one ("/machines?category=Cutting"). */
export const getMachinesListUrl = (category?: string) =>
    category ? `${MACHINES_URL}?${new URLSearchParams({ category })}` : MACHINES_URL;

/** A blog post's page. */
export const getBlogPostUrl = (slug: string) => `${BLOG_URL}/${slug}`;

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
    