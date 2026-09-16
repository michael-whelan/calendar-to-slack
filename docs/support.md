---
title: Support
---

# Support

Calendar to Slack is maintained on GitHub. Report anything broken, or ask a question, at
[github.com/michael-whelan/calendar-to-slack/issues](https://github.com/michael-whelan/calendar-to-slack/issues).

Support is best effort and free. Including the version shown at the bottom of the add-on's
settings card makes a report much faster to act on.

## Common problems

The add-on isn't in the side panel. Reload Google Calendar. If the add-on strip down the far
right edge isn't visible at all, expand the side panel with the arrow at the bottom right.
Newly installed add-ons sometimes need a browser reload before Calendar picks them up.

Connect Slack does nothing, or Slack says the request was declined. Most workspaces route new
app installations through an administrator. Slack sends them the request when you click
through; you can connect once they approve it. If you are the administrator, approve it from
the workspace's app management screen.

It says none of the guests are in this Slack workspace. Guests are matched by email address,
so the address on the invitation has to be the address on the Slack account. External guests,
personal addresses and people who have left will not match. Aliases often will not either.

It opened a group DM instead of a channel. Your workspace forbids creating channels through
the API, which Slack reports as `restricted_action`. The add-on falls back to a group DM so
the conversation still happens. A group DM holds nine people including you, so larger
meetings fail outright. Lifting the workspace restriction restores real channels.

Slack rejected the stored token. Click Disconnect and connect again. This usually means the
token was revoked from the Slack side, either by you or by an administrator.

The channel name has a number on the end. The name you asked for already existed, so it
retried with a suffix. It tries up to five.

## Removing it

Click Disconnect in the add-on to revoke the Slack token, then uninstall from the Google
Workspace Marketplace. The [privacy policy](privacy.md) sets out exactly what that removes.
