# Calendar to Slack

A button in the Google Calendar side panel that turns a meeting's guest list into a private Slack
channel. No typing names. Guests who aren't in your Slack workspace are skipped silently.

It's a Google Workspace Add-on written in Apps Script — no server, no hosting, no database. Each
company deploys its own copy with its own Slack app, so no one's tokens ever leave their workspace.

## Using it

1. Open [Google Calendar](https://calendar.google.com) and click a meeting to open it.
2. In the add-on strip down the far right edge of the screen — the same one holding Tasks, Keep and
   Contacts — click the Calendar to Slack icon. If the strip isn't visible, expand the side panel
   with the arrow at the bottom right.
3. The card shows how many guests are on the meeting and prefills a channel name from its title.
   Edit the name if you want.
4. Click Create private channel. The channel exists in Slack by the time the confirmation appears.

## Setup

Takes about 15 minutes. You need to be able to create a Slack app in your workspace.

### 1. Create the Slack app

At [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch.

Under OAuth & Permissions, add these three scopes:

| Scope | Why |
| --- | --- |
| `groups:write` | create the private channel and invite people to it |
| `users:read` | read the workspace member list |
| `users:read.email` | match calendar guests to Slack accounts by email |

Add them as User Token Scopes, not Bot Token Scopes. Most workspaces restrict channel creation, and
Slack applies that policy to apps — a bot token then fails with `restricted_action` no matter what
scopes it holds. A user token acts as you, so it inherits your own permissions, and it leaves no bot
sitting in every channel it creates.

Install the app to your workspace and copy the User OAuth Token (starts with `xoxp-`).

Use a Bot Token Scope setup instead only if your workspace lets apps create channels and you'd rather
the channels not be attributed to a person. The code accepts either.

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

- Property `SLACK_USER_TOKEN`, value your `xoxp-` token.

If you went the bot route instead, name the property `SLACK_BOT_TOKEN`. When both exist the user
token wins.

### 4. Deploy it

In the editor: Deploy → Test deployments → Install. Reload Google Calendar, open any meeting, and
the add-on appears in the right-hand side panel.

To give it to your whole company instead of just yourself, publish it as a private Workspace
Marketplace app: Deploy → New deployment → Add-on, then follow
[Publish a private app](https://developers.google.com/workspace/marketplace/how-to-publish). Your
Google Workspace admin installs it once for everyone. No Google review is required for private
domain-only publishing.

## Optional: a button in the event popup (Chrome extension)

The add-on can only live in Calendar's side panel — Google exposes no way to put a control in the
event popup itself. The `extension/` directory works around that by injecting a button into the
popup. It holds no Slack credentials: it posts the guest list to the Apps Script project, which does
the work with the token it already has.

This is a DOM hack against markup Google doesn't guarantee. Expect it to need a fix whenever Calendar
is reskinned; the fragile parts are isolated in `readGuests()` and `readTitle()` in `content.js`.

1. In Script Properties add a second property, `SHARED_SECRET`, set to a long random string. It is
   the only thing guarding the endpoint.
2. In the Apps Script editor: Deploy → New deployment → Web app. Execute as *me*, access *Anyone*.
   Copy the `/exec` URL.
3. In Chrome: `chrome://extensions` → enable Developer mode → Load unpacked → pick `extension/`.
4. Click the extension's Details → Extension options, and paste the web app URL and the secret.

Reload Calendar and open a meeting. The button appears in the popup next to the title.

Access *Anyone* means the endpoint is reachable by anyone who has the URL, with the shared secret as
the only check. That's a deliberate trade for keeping the extension credential-free and serverless.
If that isn't acceptable in your organisation, don't deploy the web app — the side-panel add-on needs
none of this.

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
