# Calendar to Slack

A button in the Google Calendar side panel that turns a meeting's guest list into a private Slack
channel. No typing names. Guests who aren't in your Slack workspace are skipped silently.

It's a Google Workspace Add-on written in Apps Script — no server, no hosting, no database. Each
company deploys its own copy with its own Slack app, so no one's tokens ever leave their workspace.

## Setup

Takes about 15 minutes. You need to be able to create a Slack app in your workspace.

### 1. Create the Slack app

At [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch.

Under OAuth & Permissions, add these Bot Token Scopes:

| Scope | Why |
| --- | --- |
| `groups:write` | create the private channel and invite people to it |
| `users:read` | read the workspace member list |
| `users:read.email` | match calendar guests to Slack accounts by email |

Install the app to your workspace and copy the Bot User OAuth Token (starts with `xoxb-`).

### 2. Create the Apps Script project

```sh
npm install -g @google/clasp
clasp login
clasp create --type standalone --title "Calendar to Slack"
clasp push --force
```

Answer `.clasp.json` prompts with the repo root. `--force` is needed because `clasp create` writes
its own `appsscript.json`, which this repo's version replaces.

### 3. Add the token

Open the project with `clasp open`, then Project Settings → Script Properties → Add:

- Property `SLACK_BOT_TOKEN`, value your `xoxb-` token.

### 4. Deploy it

In the editor: Deploy → Test deployments → Install. Reload Google Calendar, open any meeting, and
the add-on appears in the right-hand side panel.

To give it to your whole company instead of just yourself, publish it as a private Workspace
Marketplace app: Deploy → New deployment → Add-on, then follow
[Publish a private app](https://developers.google.com/workspace/marketplace/how-to-publish). Your
Google Workspace admin installs it once for everyone. No Google review is required for private
domain-only publishing.

## Scopes it asks for

| Scope | Why |
| --- | --- |
| `calendar.addons.execute` | run the add-on in Calendar |
| `calendar.addons.current.event.read` | read the guest list of the event you have open |
| `calendar.events.readonly` | read the meeting title, to prefill the channel name |
| `script.external_request` | call the Slack API |

Only the open event's guests are ever read. If you'd rather not grant `calendar.events.readonly`,
delete that line from `appsscript.json` along with the `dependencies` block — the channel name field
just starts blank instead of prefilled, and nothing else changes.

## Known limits

- Calendar add-ons render on the web and in the Android Calendar app. Not iOS.
- Meeting rooms and resource calendars are filtered out; external guests and ex-employees are skipped
  because they have no Slack account to match.
- If the channel name is taken, it retries with `-2`, `-3`, and so on up to `-5`.

## Licence

MIT
