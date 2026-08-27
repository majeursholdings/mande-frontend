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

export const ARTISAN_LOGIN_URL = "/artisan/login"
export const ARTISAN_SIGNUP_URL = "/artisan/sign-up"

export const ADMIN_LOGIN_URL = "/admin/login"
export const ADMIN_SIGNUP_URL = "/admin/sign-up"
    