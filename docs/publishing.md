# Publishing checklist

Console work for getting the add-on listed publicly. None of it can be scripted; all of it
needs your Google or Slack login. Ordered so nothing blocks on something later in the list.

The long pole is OAuth verification — weeks, not days, and outside your control. Submit it as
early as you can and do the listing polish while it queues.

## 1. Publish the policy pages

GitHub repository → Settings → Pages → deploy from branch `main`, folder `/docs`.

Gives you the three URLs the listing requires:

- Privacy `https://calendar-to-slack.michaelwhelan.dev/privacy`
- Terms `https://calendar-to-slack.michaelwhelan.dev/terms`
- Support `https://calendar-to-slack.michaelwhelan.dev/support`

Confirm each one loads before going further. `logoUrl` in `appsscript.json` points at
`/assets/logo-128.png` on the same host, so the add-on's own icon breaks until Pages is live.

## 2. Verify the domain

The pages are served from GitHub Pages on a custom domain, `docs/CNAME`. They cannot be
served from `*.github.io`: OAuth verification requires the homepage, privacy and terms URLs
to sit on a **domain** property verified in Search Console, and `github.io` is on the Public
Suffix List and owned by GitHub, so nobody else can verify it. A URL-prefix property does
verify, which is misleading — it satisfies Search Console but not the OAuth check, which is
where this was first rejected.

DNS is a single `CNAME` from the subdomain to `<user>.github.io`. On Cloudflare the record
must be **DNS only**, not proxied: the orange cloud blocks GitHub's certificate validation,
and on a `.dev` domain, which is HSTS-preloaded, no certificate means the site does not load
at all.

Then [Search Console](https://search.google.com/search-console) → add a **Domain** property
for the parent domain, verified by TXT record, and confirm the Cloud project's owning account
is the same one that verified it.

## 3. Cloud project

[Cloud console](https://console.cloud.google.com) → new project, and note its project number.

In the Apps Script editor → Project Settings → Google Cloud Platform project → Change
project → paste the number. A Marketplace app cannot use the default script-managed project.

In the Cloud project, enable the Google Workspace Marketplace SDK and the Apps Script API.

## 4. OAuth consent screen

Cloud console → APIs and services → OAuth consent screen → External.

App name `Calendar to Slack`, your support email, the 128px logo from `docs/assets/`, the
homepage, privacy and terms URLs from step 1, and a developer contact address.

Scopes → Add or remove scopes. Add exactly these four and nothing more:

    https://www.googleapis.com/auth/calendar.addons.execute
    https://www.googleapis.com/auth/calendar.addons.current.event.read
    https://www.googleapis.com/auth/calendar.events.readonly
    https://www.googleapis.com/auth/script.external_request

The sensitive two, `calendar.events.readonly` and `calendar.addons.current.event.read`, are
not in the picker table — paste them into the manual field below it. Justifications to go
with them are in `listing.md`.

`appsscript.json` is the source of truth for this list. Changing a scope there means
mirroring it in the block above, on this screen, and in the Marketplace SDK at step 6: the
three have to match exactly or review bounces, which is what happened the first time.

Then submit for verification — mandatory for a public app, because of those two sensitive
scopes. The justification to write: guest addresses are read from the open event only, to
match Slack accounts, and are not retained; the title is read only to prefill the channel
name.

## 5. Add-on deployment

Apps Script editor → Deploy → New deployment → type Add-on. Copy the deployment ID.

Set `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in Project Settings → Script Properties
before testing, or Connect Slack shows the missing-credentials message.

Test through Deploy → Test deployments → Install before submitting anything.

## 6. Marketplace SDK configuration

Cloud console → Google Workspace Marketplace SDK → App Configuration.

Visibility public, app integration Google Workspace Add-on, and the deployment ID from step 5.

OAuth scopes → declare the same four, copied from the block at step 4.

## 7. Store listing

Same SDK → Store Listing. Assets are in `docs/assets/`, regenerate with
`tools/make-icons.py`.

- Icons 32x32 and 128x128. Also 48x48 and 96x96 if the project ever ships a web app again.
- Banner exactly 220x140.
- Screenshots 1280x800 preferred, minimum one, maximum ten, square corners and full bleed.
  These have to be real screenshots of the add-on in Calendar — take them by hand.
- Terms, privacy and support URLs from step 1.
- Category, language, and a description. The README opening is a reasonable starting point.

Then submit for review.

## 8. Slack public distribution

[api.slack.com/apps](https://api.slack.com/apps) → your app → Manage Distribution.

Confirm the redirect URL is the script callback,
`https://script.google.com/macros/d/<scriptId>/usercallback`, over HTTPS, then work the
checklist and click Activate Public Distribution.

This needs no App Directory review. Directory listing is a separate, much larger submission
and is not required for other workspaces to install.

Expect installs in most workspaces to need an administrator's approval. That is Slack policy,
not something the add-on can route around; the settings card says so up front.
