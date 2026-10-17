# Analytics, ad pixels and cookie consent

The website loads every analytics and advertising tool (Google Analytics, Meta Pixel, TikTok Pixel) through one Google Tag Manager container, and only after the visitor allows it in the cookie banner. This guide covers turning it on, setting up the container, and the events the site sends.

The code is in `lib/consent.ts` (choices, Consent Mode, loading Tag Manager), `lib/analytics.ts` (the events, purchase values, click tracking) and `components/consent/consentProvider.tsx` (banner, settings dialog). What visitors are told is in the Cookie policy (`/legals/cookie-policy`, in Sanity). Keep the policy and the container in step: a new tool or cookie needs a line in the policy before it goes live.

## How it behaves

- **First visit:** the banner asks. Nothing optional loads until they choose. "Reject all" is as prominent as "Accept all".
- **Choices:** analytics and advertising, each on or off. They're saved in the `mande_consent` cookie for 12 months. Raise `CONSENT_VERSION` in `lib/consent.ts` when the categories change, so everyone is asked again.
- **Tag Manager loads** only once analytics or advertising is allowed. Before it loads, Google Consent Mode is set to "denied" for everything, then updated to the visitor's choices:

  | Choice | Consent Mode |
  | --- | --- |
  | Analytics | `analytics_storage` |
  | Advertising | `ad_storage`, `ad_user_data`, `ad_personalization` |

- **Changing their mind:** "Cookie settings" in the footer reopens the choices. Switching a category off clears its cookies (`_ga*`, `_gid`, `_fbp`, `_fbc`, `_ttp`, `_tt_enable_cookie`, `_gcl_*`) and reloads the page, so its tools stop.
- **Staff dashboards** (`/admin`, `/super-admin`) never show the banner or load Tag Manager.

## Turning it on

1. Create a web container in Google Tag Manager.
2. Set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX` in the website's environment and redeploy.

   Without it, there's no banner, no "Cookie settings" link and no Tag Manager. It's only read in production builds, so `next dev` never loads Tag Manager. To try it locally, run `next build && next start` with the ID set.
3. Check it's working with Tag Manager's **Preview** (Tag Assistant): open the site, accept cookies, and the container connects. The "Test your website" check in the install dialog always says the tag wasn't detected, because Tag Manager only loads after a visitor accepts cookies.
4. Publish the **Cookie policy** and the updated **Privacy policy** in Sanity at the same time. The banner and the footer link to them.

## Setting up the container

The whole container is in [`docs/gtm/mande-container.json`](gtm/mande-container.json): GA4, Google Ads, Meta Pixel and TikTok Pixel, with every tag already requiring its consent. To load it:

1. In Tag Manager, open **Admin › Import Container**, choose the file, pick the **Default Workspace**, choose **Merge › Overwrite conflicting tags, triggers and variables**, and confirm.
2. Open **Variables** and set the constants. Each ID lives in one place:

   | Variable | Where to find it |
   | --- | --- |
   | `CONST - GA4 Measurement ID` | Already set to `G-L27BPQGCN2` (GA4 › Admin › Data streams › the web stream) |
   | `CONST - Meta Pixel ID` | Meta Events Manager › Data sources › the pixel |
   | `CONST - TikTok Pixel ID` | TikTok Ads Manager › Assets › Events › Web events |
   | `CONST - Google Ads ID` | Google Ads › Goals › Conversions › a conversion's tag setup (`AW-123456789`: enter only the number) |
   | `CONST - Google Ads Purchase Label`, `CONST - Google Ads Sign-up Label` | The same place, one conversion action each |

3. The GA4 tags run as soon as the Measurement ID is in. The Google Ads, Meta and TikTok tags are imported **paused**: unpause each platform's tags once its ID is in (Tags › tick them › Unpause).
4. Admin › Container Settings: turn on **Enable consent overview**.
5. **Preview**, accept cookies on the site, check the tags fire (see "Checking it works" below), then **Submit** to publish.

To change the container, edit it in Tag Manager, then **Admin › Export Container** and replace the file here, so the two stay in step.

### What's in it

| Tag | Fires on | Requires consent |
| --- | --- | --- |
| GA4 - Google tag | Initialization: All Pages | `analytics_storage` |
| GA4 - sign_up, begin_checkout, purchase, generate_lead, form events, video events, cta_click, contact_click | The matching custom event | `analytics_storage` |
| Google Ads - Conversion Linker | All Pages | `ad_storage` |
| Google Ads - Remarketing | All Pages | `ad_storage`, `ad_user_data`, `ad_personalization` |
| Google Ads - Purchase / Sign-up conversion | `purchase` / `sign_up` | `ad_storage`, `ad_user_data` |
| Meta - Pixel base, PageView (page change), CompleteRegistration, InitiateCheckout, Purchase, Lead, Contact | All Pages, page changes, the matching event | `ad_storage`, `ad_user_data` |
| TikTok - Pixel base, Page (page change), CompleteRegistration, InitiateCheckout, CompletePayment, SubmitForm, Contact | All Pages, page changes, the matching event | `ad_storage`, `ad_user_data` |

Requiring the consent on each tag means a tag never fires, and never sets cookies, for a category the visitor hasn't allowed. That's what the Cookie policy promises. Purchases send the booking code or payment reference as the event ID, so a refreshed confirmation page isn't counted twice.

## GA4 setup

In GA4 (Admin):

1. **Data streams › the web stream › Enhanced measurement:** keep it on, with **Page changes based on browser history events** ticked (the site changes pages without reloading). Turn **Form interactions** and **Video engagement** off: the site sends its own, more accurate, form and video events.
2. **Events › Key events:** `purchase` is one already. Mark `sign_up`, `generate_lead` and `begin_checkout` too.
3. **Custom definitions › Create custom dimension** (scope: Event), one per parameter: `user_type`, `purchase_type`, `checkout_type`, `form_name`, `topic`, `cta_text`, `cta_location`, `contact_method`, `video_percent`. GA4 already knows `method`, `video_title`, `video_url`, `video_provider`, `link_url` and the ecommerce fields.
4. **Data retention:** set it to **14 months** (Data collection and modification › Data retention). The default is 2 months, and the Privacy policy says 14.
5. **Product links › Google Ads links:** link the Google Ads account, with personalised advertising on. GA4 audiences then show up in Google Ads for retargeting.
6. **Data collection:** turn on **Google signals**. Consent Mode's `ad_personalization` still decides, visitor by visitor.

### Retargeting audiences

Create these in GA4 (Admin › Audiences), and the same in Meta (Audiences › Custom audience › Website) and TikTok (Audiences › Website traffic) from their events:

| Audience | Include | Exclude | Membership |
| --- | --- | --- | --- |
| Started sign-up, didn't finish | `form_start` with `form_name` = `manufacturer_sign_up` | `sign_up` | 30 days |
| Signed up, didn't pay for a plan | `sign_up` | `purchase` with `purchase_type` = `plan` | 30 days |
| Started a machine booking, didn't pay | `begin_checkout` with `checkout_type` = `machine_booking` | `purchase` with `purchase_type` = `machine_booking` | 14 days |
| Watched a video to the end | `video_complete` | | 60 days |
| Visited the machines pages | `page_view` with page path containing `/machines` | `purchase` | 30 days |
| Paying makers (for lookalikes, or to exclude) | `purchase` | | 540 days |

## Events the site sends

These events reach the `dataLayer` only once the visitor has allowed analytics or advertising, and they never contain names, emails, phone numbers or typed messages. Amounts are in naira (`NGN`).

| `event` | When | Fields |
| --- | --- | --- |
| `sign_up` | A maker creates an account (sign-up step 1) | `method` (`email`), `user_type` (`manufacturer`) |
| `begin_checkout` | They leave for the payment page: a plan at sign-up, or a machine booking | `checkout_type` (`plan` or `machine_booking`), `ecommerce` (`currency`, `items`; `value` for bookings) |
| `purchase` | A payment is confirmed: the plan at sign-up, or a machine booking | `purchase_type` (`plan` or `machine_booking`), `ecommerce` (`transaction_id`, `value` paid, `currency`, `coupon`, `items`) |
| `generate_lead` | The contact form is sent | `form_name`, `topic` |
| `form_start` | The first field of a tracked form is focused | `form_name` |
| `form_submit` | A tracked form is sent and accepted | `form_name` |
| `form_error` | Sending a tracked form fails | `form_name` |
| `video_start`, `video_progress`, `video_complete` | A website video starts, passes 25%, 50% and 75%, and ends | `video_title`, `video_url`, `video_percent`, `video_duration`, `video_provider` |
| `cta_click` | A button or link is clicked on the website, sign-up or login pages | `cta_text` (its words), `link_url`, `cta_location` (the page path) |
| `contact_click` | A WhatsApp, email or phone link is clicked | `contact_method`, `cta_location` |
| `consent_updated` | The visitor changes their cookie choices | |

Tracked forms (`form_name`): `contact`, `support_feedback` (Profile › Talk to support), `machine_booking`, `manufacturer_sign_up`.

- **A new event:** add it to `TrackedEvent` in `lib/analytics.ts`, call `trackEvent(...)` where it happens, then add a trigger and tag in the container.
- **A new form:** add its name to `TrackedFormName`, pass `trackingName` to its `MainForm` (that sends `form_start`), and call `trackEvent` for `form_submit` and `form_error` in its submit handler.
- **Clicks:** every button and link is tracked by its words. Give a button `data-track-name="…"` when its words don't say enough (an icon button, say), or `data-track="off"` to leave it out. Dashboards aren't click-tracked, because their buttons can hold names and amounts.
- **Videos:** every `VideoPlayer` is tracked. Pass `title` so reports show a readable name.

## Checking it works

Click **Preview** in Tag Manager, enter `https://www.mande.com.ng`, accept cookies, then:

- click a button and see `cta_click`, with **GA4 - cta_click** under Tags Fired
- play a video on the About page and see `video_start`
- open the contact page, click into a field and see `form_start`

For revenue, check GA4 › Reports › Monetization the day after a real plan payment or booking. Realtime shows purchases within a minute. The "Test your website" button in Tag Manager's install dialog always says the tag wasn't detected: Tag Manager waits for consent, and that test never gives it.

## Marketing emails

The sign-up form, the machine booking form and the contact form each have an optional, unticked "Email me news…" box. When it's ticked, the API saves the time in `marketingOptInAt`:

- sign-up: on the manufacturer's profile
- machine booking: on the booking
- contact form: on the contact message

Sign-up also saves `termsAcceptedAt`.

When an email marketing service is chosen:

- Sync only the people with a `marketingOptInAt`.
- Make sure every marketing email has an unsubscribe link.
- Name the service in the Privacy policy.

Account, job, payment and booking emails are not marketing, and keep going to everyone.
