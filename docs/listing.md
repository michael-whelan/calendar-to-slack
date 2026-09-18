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

Screenshots are not generated — Google wants real captures of the add-on running.

Capture them in a throwaway environment, not in Biorce. Two reasons: these go on a public
page, so a real meeting title and real colleague addresses would be published with them; and
Biorce's Slack forbids creating channels, so the only thing capturable there is the group-DM
fallback rather than the private channel this listing leads with. A free Slack workspace and
a calendar meeting with two or three accounts you control solves both.

Set the capture up so there is nothing to redact afterwards. Editing a real screenshot is
slower than staging a clean one and tends to look retouched.

- Create a meeting for the purpose, titled generically — `Project kickoff` rather than
  anything internal.
- Put it on an empty future day, so the grid behind the popup carries no real event titles.
- Add no Google Meet and no room. A conferencing block publishes a live join link, a dial-in
  number and a PIN.
- Invite two or three people who are in the connected Slack workspace. The popup shows a
  count, not names, unless the guest list is expanded — leave it collapsed.
- Turn off other Calendar add-ons first. Third-party panels overlay their own data on the
  event, and a meeting-cost estimate is not something to publish.
- Collapse the left rail, or crop it. Time Insights prints your meeting hours and your
  booking-page name.
- Use the same light or dark theme for all three shots.

Take these three, then run `tools/fit-screenshot.sh <files>` to fit them to 1280x800:

1. The side panel open on a meeting, showing the guest count and the prefilled channel name.
2. The confirmation toast naming the channel it created.
3. The settings card showing Connected as, with the Disconnect button.

Suggested captions, if the form asks:

    1. Open a meeting, and the add-on has already read the guest list.
    2. One click. The channel exists before the confirmation clears.
    3. Connect your own Slack account once. Disconnect revokes it.

The toast in shot 2 clears within a few seconds and creating opens Slack in a new tab, which
takes the focus, so it is difficult to catch by hand. Use `tools/delayed-capture.sh 6`, switch
to Calendar, and click while the timer runs.

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
