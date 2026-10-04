/** Where the public website lives, without a trailing slash (for sitemaps and absolute links). */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
