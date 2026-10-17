# Analytics, ad pixels and cookie consent

The website loads every analytics and advertising tool (Google Analytics, Meta Pixel, TikTok Pixel) through one Google Tag Manager container, and only after the visitor allows it in the cookie banner. This guide covers turning it on, setting up the container, and the events the site sends.

The code is in `lib/consent.ts` (choices, Consent Mode, events) and `components/consent/consentProvider.tsx` (banner, settings dialog, loading Tag Manager). What visitors are told is in the Cookie policy (`/legals/cookie-policy`, in Sanity). Keep the policy and the container in step: a new tool or cookie needs a line in the policy before it goes live.

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

   Without it, there's no banner, no "Cookie settings" link and no Tag Manager.
3. Publish the **Cookie policy** and the updated **Privacy policy** in Sanity at the same time. The banner and the footer link to them.

## Setting up the container

In the container, open Admin › Container Settings and turn on **Enable consent overview**. Then add the tags below, each with **Additional consent checks › Require additional consent for tag to fire**.

| Tag | Trigger | Requires consent |
| --- | --- | --- |
| Google tag (GA4 config, your `G-` ID) | Initialization: All Pages | `analytics_storage` |
| GA4 events (see below) | Custom events | `analytics_storage` |
| Meta Pixel (Community Template Gallery, your pixel ID) | All Pages, plus the custom events | `ad_storage` |
| TikTok Pixel (Community Template Gallery, your pixel ID) | All Pages, plus the custom events | `ad_storage` |
| Google Ads conversion / linker (if used) | The custom events | `ad_storage` |

Requiring the consent on each tag means a tag never fires, and never sets cookies, for a category the visitor hasn't allowed. That's what the Cookie policy promises.

### Settings to check

- **Google Analytics data retention:** set it to **14 months** (Admin › Data collection and modification › Data retention). The default is 2 months, and the Privacy policy says 14.
- **Advanced matching / enhanced conversions** (sending a hashed email or phone number): only turn these on in tags that require `ad_user_data`. The Privacy policy covers it as "may send a scrambled form".
- **Google signals and ad personalisation:** leave them to Consent Mode's `ad_personalization`.

## Events the site sends

These events reach the `dataLayer` only once the visitor has allowed analytics or advertising, and they never contain names, emails or phone numbers. Use them as Custom Event triggers, and map them to each platform's standard event.

| `event` | When | Fields | GA4 | Meta | TikTok |
| --- | --- | --- | --- | --- | --- |
| `sign_up` | A maker creates an account (sign-up step 1) | | `sign_up` | `CompleteRegistration` | `CompleteRegistration` |
| `plan_purchase` | A plan payment is confirmed at sign-up | `transaction_id`, `plan`, `billing_cycle` | `purchase` | `Subscribe` | `Subscribe` |
| `machine_booking_purchase` | A machine booking's payment is confirmed | `transaction_id`, `value` (naira), `currency` (`NGN`) | `purchase` | `Purchase` | `CompletePayment` |
| `generate_lead` | The contact form is sent | `topic` | `generate_lead` | `Lead` | `SubmitForm` |
| `consent_updated` | The visitor changes their choices | | | | |

To add an event, extend `TrackedEvent` in `lib/consent.ts` and call `trackEvent(...)` where it happens.

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
