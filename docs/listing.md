# Store listing copy

Paste-ready values for the Marketplace SDK store listing form. Field lengths are capped by
the form rather than stated in the docs — if one rejects, trim from the end; each entry below
front-loads the important half.

Console path: Cloud console → Google Workspace Marketplace SDK → Store Listing.

## Identity

Application name

    Calendar to Slack

Short description

    Turn a meeting's guest list into a private Slack channel, in one click.

Detailed description

    Calendar to Slack turns the people on a meeting into a private Slack channel, without
    typing a single name.

    Open a meeting in Google Calendar, open the add-on in the side panel, and click Create
    private channel. It matches the guests to Slack accounts by email address, creates the
    channel, and invites everyone it matched. The channel name is prefilled from the meeting
    title, and you can edit it before you click.

    It is deliberately one thing done well. There are no rules to configure, no automation to
    maintain, and no bot left sitting in your channels afterwards. You decide, per meeting,
    whether a conversation is worth a channel — the add-on just removes the three minutes of
    copying addresses.

    Everyone connects their own Slack account, and channels are created by you, as you, with
    your own permissions. Guests who are not in your Slack workspace are skipped silently.

    Where a workspace forbids creating channels through the API, which is common on
    Enterprise Grid, it opens a group DM with the same people instead so the conversation
    still happens.

    Free and open source. MIT licensed, source at
    github.com/michael-whelan/calendar-to-slack

Category

    Productivity

Keywords

    slack, calendar, meetings, channel, chat, productivity, collaboration

## Developer

    Developer name     Michael Whelan
    Website            https://michael-whelan.github.io/calendar-to-slack/
    Support email      the address you want on the public listing

## URLs

    Terms of service   https://michael-whelan.github.io/calendar-to-slack/terms
    Privacy policy     https://michael-whelan.github.io/calendar-to-slack/privacy
    Support            https://michael-whelan.github.io/calendar-to-slack/support

## Graphics

All in `docs/assets/`, regenerate with `python3 tools/make-icons.py`.

    Icon 32x32         logo-32.png
    Icon 128x128       logo-128.png
    Icon 48x48         logo-48.png        only needed if a web app ships again
    Icon 96x96         logo-96.png        only needed if a web app ships again
    Banner 220x140     banner-220x140.png

Screenshots are not generated — Google wants real captures of the add-on running. Take these
three at any size and run `tools/fit-screenshot.sh <files>` to fit them to 1280x800:

1. The side panel open on a meeting, showing the guest count and the prefilled channel name.
2. The confirmation toast naming the channel it created.
3. The settings card showing Connected as, with the Disconnect button.

Suggested captions, if the form asks:

    1. Open a meeting, and the add-on has already read the guest list.
    2. One click. The channel exists before the confirmation clears.
    3. Connect your own Slack account once. Disconnect revokes it.

## Scope justifications

For the OAuth consent screen. Reviewers reject vague answers, so each names the feature and
the limit.

    calendar.addons.execute
    Required for the add-on to run in the Google Calendar side panel.

    calendar.addons.current.event.read
    Reads the guest list and organiser of the single event the user currently has open, to
    match those people to Slack accounts. No other event is read. Addresses are sent to Slack
    to look them up and are not retained.

    calendar.events.readonly
    Reads the title of the open event to prefill the channel name field. The Calendar add-on
    event object does not carry the event title, so it cannot be obtained any other way. No
    event content is stored.

    script.external_request
    Required to call the Slack API at https://slack.com/api/, which is the only external
    destination in the code and the only host in the manifest's urlFetchWhitelist.
