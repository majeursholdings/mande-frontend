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
        href: "/open-jobs",
    },
    {
        label: "Help Center",
        subMenu: [
            {
                label: "Contact",
                href: "/contact-mande",
            },
            {
                label: "Frequently Asked Questions",
                href: "/faq",
            },
        ],
    },
    {
        label: "About",
        href: "/about-mande",
    },
]

export const footerMenu: Mainmenu[] = [
    {
        label: "About",
        href: "/about-mande",
    },
    {
        label: "Services",
        href: "/mande-services",
    },
    {
        label: "Contact",
        href: "/contact-mande",
    },
    {
        label: "FAQs",
        href: "/faqs",
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

export const ARTISAN_LOGIN_URL = "/manufacturer/login";
export const ARTISAN_SIGNUP_URL = "/manufacturer/registration";
export const ARTISAN_FORGOT_PASSWORD_URL = "/manufacturer/forgot-password";

export const ADMIN_LOGIN_URL = "/admin/login"
export const ADMIN_SIGNUP_URL = "/admin/sign-up"
export const ADMIN_FORGOT_PASSWORD_URL = "/admin/forgot-password"
    