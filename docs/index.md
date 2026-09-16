---
title: Calendar to Slack
---

# Calendar to Slack

Turns a meeting's guest list into a private Slack channel, from the Google Calendar side
panel. No typing names, no copying addresses. Guests who aren't in your Slack workspace are
skipped silently.

Open a meeting, open the add-on, click Create private channel. The channel exists in Slack by
the time the confirmation appears, with everyone from the invitation already in it.

## Install

Install from the Google Workspace Marketplace — listing link pending review.

Each person connects their own Slack account the first time they use it. There is nothing to
deploy, no script to run, and no token to paste. Nobody acts on anyone else's behalf.

## Pages

- [Privacy policy](privacy.md)
- [Terms of service](terms.md)
- [Support](support.md)
- [Source on GitHub](https://github.com/michael-whelan/calendar-to-slack)

## What it asks for

In Google, permission to run in Calendar, to read the guest list of the event you have open,
and to read meeting titles so it can prefill the channel name. In Slack, permission to create
private channels and invite people, to look up members by email address, and to open a group
DM where your workspace forbids creating channels.

Nothing is stored except your Slack token, which you can revoke at any time by clicking
Disconnect. The [privacy policy](privacy.md) has the detail.
