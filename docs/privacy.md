---
title: Privacy Policy
---

# Privacy Policy

Calendar to Slack, last updated 30 September 2026.

Calendar to Slack is a Google Workspace™ add-on that creates a private Slack channel from the
guest list of a Google Calendar™ meeting. This policy describes exactly what Google user data
it reads, what it stores, and who it sends data to.

## What Google user data it reads

When you open a meeting in Google Calendar with the add-on open, it reads the guest list and
organiser of that one event, and the meeting title. It reads nothing from any other event,
and nothing from your calendar when the add-on is not open. It reads no other Google user
data: not your times or availability, not changes to events, and no Google profile or contact
information.

When you click Create private channel, the guest email addresses are sent to Slack to look up
matching accounts in your workspace.

## What it stores

One thing: the Slack access token produced when you click Connect Slack.

The token is stored in Apps Script user properties, which are scoped to your own Google
account within this add-on. No other user of the add-on can read it. Neither your Google
Workspace administrator nor the maintainer of this add-on can read it.

Nothing else is stored. Guest addresses, meeting titles and the names of channels created are
used to complete the request you asked for and are not written anywhere afterwards. There is
no database, no server, and no log of your activity beyond Google's own Apps Script error
reporting, which records unhandled exceptions without event content.

## Who it sends data to

Slack only, at `https://slack.com/api/`, and only to carry out an action you triggered:
looking up guests by email address, creating the channel, and inviting the people it matched.

No data is sent to the maintainer, to an analytics provider, to an advertising network, or to
any other third party. There is no other network destination in the code. Google user data is
never sold, rented or shared.

## How your data is protected

In transit: every call the add-on makes is over HTTPS. The only outbound destination in the
code is `https://slack.com/api/`, and the manifest's URL allowlist permits no other, so there
is no endpoint it could reach unencrypted. Calendar data reaches the add-on inside Google's
own infrastructure and never crosses a network the add-on controls.

At rest: the Slack token is the only stored value, held in Apps Script user properties on
Google's platform, which encrypts stored data at rest.

Data minimisation: no calendar content is stored at all. Guest addresses and the meeting title
are read at the moment you act, used to complete that action, and discarded.

Access control: only this add-on running under your own Google account can read the stored
token. There is no server, no database and no operations team, so there are no employees or
subprocessors with routine access to your Google user data.

## Google user data and Limited Use

Calendar to Slack's use of information received from Google APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements.

Specifically: Google user data is used only to provide the channel-creation feature you
invoke, is never transferred to others except as needed to provide that feature, is never
used for advertising, and is never read by humans except with your explicit consent, to
resolve a support request you raised, for security purposes, or where required by law.

## Retention and removing your data

The Slack token is kept only while you are using the add-on, and no calendar data is retained
at any point. There is no retention period to wait out: the token is deleted the moment you
disconnect or uninstall.

Open the add-on in the Google Calendar side panel with no meeting selected and click
Disconnect. This revokes the token at Slack and deletes the stored copy immediately. Nothing
of yours remains afterwards.

Uninstalling the add-on from the Google Workspace Marketplace also removes the stored token,
along with the add-on's access to your calendar. If you uninstall without disconnecting
first, revoke the app from your Slack workspace's installed apps list to invalidate the token
at Slack's end.

## Children

Calendar to Slack is a workplace tool and is not directed at children under 13.

## Changes

Material changes to this policy will be published on this page with a new date above. The
page history is public at
[github.com/michael-whelan/calendar-to-slack](https://github.com/michael-whelan/calendar-to-slack).

## Contact

Questions, or a request about your data: open an issue at
[github.com/michael-whelan/calendar-to-slack/issues](https://github.com/michael-whelan/calendar-to-slack/issues).
