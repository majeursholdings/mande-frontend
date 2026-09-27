// The website's pages
export const OPEN_JOBS_URL = "/open-jobs";
export const ABOUT_URL = "/about-mande";
export const CONTACT_URL = "/contact-mande";
export const FAQ_URL = "/faq";
export const PRIVACY_POLICY_URL = "/privacy-policy";

type Mainmenu = {
    label: string;
    href?: string;
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
        label: "Help Center",
        subMenu: [
            {
                label: "Contact",
                href: CONTACT_URL,
            },
            {
                label: "Frequently Asked Questions",
                href: FAQ_URL,
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
        href: "/mande-services",
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
        href: "/terms-and-conditions",
    },
    {
        label: "Legals",
        href: "/legals",
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
    