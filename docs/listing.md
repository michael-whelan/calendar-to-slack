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

    Calendar to Slack creates a private Slack channel from the people invited to a Google Calendar meeting, in one click, without typing a single name.

    HOW IT WORKS

    Open a meeting in Google Calendar and open Calendar to Slack in the side panel. The add-on reads the guest list of that meeting and shows how many people are on it, with a channel name already filled in from the meeting title. Edit the name if you want, then click Create private channel.

    The add-on matches each guest to a Slack account by email address, creates a private channel in your Slack workspace, and invites everyone it matched. Slack opens on the new channel as soon as it is created, so you can start the conversation straight away.

    WHAT HAPPENS TO PEOPLE IT CANNOT MATCH

    Guests with no Slack account in your workspace are skipped without fuss: external attendees, clients, people who have left, meeting rooms and resource calendars. You are told how many were added rather than being made to resolve each one.

    NAMING

    The channel name is taken from the meeting title, lowercased and hyphenated to fit Slack's rules. You can change it before creating. If the name is already taken, a numeric suffix is added rather than failing.

    WHO CREATES THE CHANNEL

    You do. Each person connects their own Slack account, and channels are created as that person, using their own Slack permissions. No shared bot account is involved and no bot is left sitting in the channels afterwards. Connect once and it is remembered; click Disconnect at any time to revoke it.

    WHEN YOUR WORKSPACE DOES NOT ALLOW NEW CHANNELS

    Many Slack workspaces, on Enterprise Grid in particular, restrict who may create channels. Where that applies, the add-on opens a group direct message with the same people instead, so the conversation still happens. Group DMs hold nine people including you; above that the add-on tells you rather than quietly leaving people out.

    WHAT IT READS

    Only the meeting you have open. It reads that event's guest list to match people to Slack, and that event's title to suggest a channel name. It does not read your other events, your calendars, or anything else. Guest email addresses are sent to Slack only to look up the matching account and are not stored or logged. The only thing kept is your Slack access token, held against your own Google account so that you do not have to reconnect each time, and removed when you click Disconnect.

    WHAT YOU NEED

    A Google Calendar account and a Slack account in the workspace you want channels created in. Some Slack workspaces require an administrator to approve new apps; if yours does, Slack sends the request to your admin when you connect, and you can connect once they approve it.

    DESIGNED TO DO ONE THING

    There are no rules to configure, no automation running in the background and no channels created without you asking. You decide, meeting by meeting, whether a conversation deserves a channel. The add-on only removes the few minutes of copying addresses.

    Free and open source under the MIT licence. Source code at github.com/michael-whelan/calendar-to-slack

Category

    Productivity

Keywords

    slack, calendar, meetings, channel, chat, productivity, collaboration

## Developer

    Developer name     Michael Whelan
    Website            https://calendar-to-slack.michaelwhelan.dev/
    Support email      the address you want on the public listing

## URLs

    Terms of service   https://calendar-to-slack.michaelwhelan.dev/terms
    Privacy policy     https://calendar-to-slack.michaelwhelan.dev/privacy
    Support            https://calendar-to-slack.michaelwhelan.dev/support

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

Flowtrace's cost overlay cannot be removed on a managed account, and it sits mid-card so
cropping cannot reach it. Cut it out afterwards with `tools/cut-band.py <shot> --auto`,
which finds the row by its green estimate chip and closes the card up around it.

Run `tools/capture-listing.sh` to walk all three: it prints what to put on screen, counts
down, captures, and fits the result to 1280x800 in `docs/assets/screenshots/`. Pass shot
numbers to redo only some, e.g. `tools/capture-listing.sh 2`.

The countdown exists for shot 2 — the toast clears in a few seconds and creating opens Slack
in a new tab, which takes the focus, so it cannot be caught with a keyboard shortcut.

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
