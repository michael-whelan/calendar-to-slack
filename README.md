# Calendar to Slack

Turns a meeting's guest list into a private Slack channel, from the Google Calendar side
panel. No typing names, no copying addresses. Guests who aren't in your Slack workspace are
skipped silently.

## Install

1. Install from the Google Workspace Marketplace — listing link pending review.
2. Open [Google Calendar](https://calendar.google.com) and click any meeting.
3. In the add-on strip down the far right edge — the one holding Tasks, Keep and Contacts —
   click the Calendar to Slack icon. If the strip isn't showing, expand the side panel with
   the arrow at the bottom right.
4. First run only: click Connect Slack and approve the permissions. If your workspace sends
   new apps to an admin for approval, Slack forwards the request and you can connect once
   it's approved.
5. The card shows the guest count and prefills a channel name from the meeting title. Edit
   it if you like, then click Create private channel.

There is nothing to deploy, no script to run, and no token to paste. Each person connects
their own Slack account; nobody acts on anyone else's behalf.

## What it does

It matches calendar guests to Slack accounts by email address, creates a private channel,
and invites everyone it matched. The channel is created by you, as you — the add-on holds no
bot that sits in your channels afterwards.

If the channel name is already taken it retries with `-2`, `-3`, and so on up to `-5`.

Many workspaces, Enterprise Grid ones especially, forbid creating channels through the API
even for someone who can create them by hand. Slack returns `restricted_action`, and the
add-on opens a group DM with the same people instead. That holds nine people including you,
has no name or topic, and can't be archived. Lifting the workspace restriction restores real
channels with no change here.

## What it can see

| Scope | Why |
| --- | --- |
| `calendar.addons.execute` | run the add-on in Calendar |
| `calendar.addons.current.event.read` | read the guest list of the event you have open |
| `calendar.events.readonly` | read the meeting title, to prefill the channel name |
| `script.external_request` | call the Slack API |

Only the guests of the event you currently have open are ever read. Guest addresses are sent
to Slack to look up matching accounts and are not stored.

On the Slack side it asks for `groups:write` to create the channel and invite people,
`users:read` and `users:read.email` to match guests to accounts, and `mpim:write` for the
group DM fallback. These are user token scopes, not bot scopes, so the add-on inherits your
own permissions rather than holding broader ones.

## Your data

Your Slack token is stored against your own Google account in Apps Script user properties.
No other user of the add-on can read it, and neither can your administrator or the
maintainer. Disconnecting revokes it at Slack and deletes the stored copy.

Full detail in the [privacy policy](docs/privacy.md) and [terms](docs/terms.md).

## Known limits

- Calendar add-ons render on the web and in the Android Calendar app. Not iOS.
- Meeting rooms and resource calendars are filtered out. External guests and former
  colleagues are skipped, having no Slack account in your workspace to match.
- A group DM, used when channel creation is blocked, tops out at nine people.

## Development

`Code.gs` holds everything; `appsscript.json` is the add-on manifest. There is no build step.

`tools/release.sh` pushes the current working tree, cuts a version, and points the add-on
deployment at it. It is maintainer tooling — nobody installing the add-on ever runs it.

`tools/make-icons.py` regenerates the Marketplace listing icons into `docs/assets/`.

Two script properties must be set on the Apps Script project for the OAuth flow to work:
`SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`, from the Slack app at
[api.slack.com/apps](https://api.slack.com/apps).

`docs/publishing.md` is the console checklist for getting the listing live — Cloud project,
OAuth consent screen, verification, listing assets, Slack distribution.

The `extension/` directory is a Chrome extension that injects the same button into the event
popup. It is on hold and not part of the published add-on: it depended on a web app
deployment that ran as whoever deployed it, which is wrong for a public install. Reviving it
means authenticating the caller properly. See the note above `doGet` in `Code.gs`.

## Licence

MIT
