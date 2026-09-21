/**
 * Calendar to Slack — turns a meeting's guest list into a private Slack channel.
 * Guests with no Slack account are skipped silently.
 *
 * Two front doors, one implementation: the Calendar side-panel card (onEventOpen)
 * and a web-app endpoint (doPost) used by the Chrome extension.
 */

var SLACK_API = 'https://slack.com/api/';

// Bumped whenever behaviour changes. Shown on the settings card, so a support report
// names the build it came from.
var VERSION = '12-verification';

/* ---------- core ---------- */

/** Resolves guests to Slack users, creates the private channel, invites them. */
function makeChannel(emails, name) {
  if (!slackToken()) {
    return {
      ok: false,
      code: 'not_connected',
      error: 'Connect Slack first — open Calendar to Slack in the Google Calendar sidebar.'
    };
  }

  name = slugify(name);
  if (!name) return { ok: false, error: 'Give the channel a name first.' };

  var me = slack('auth.test');
  if (!me.ok) return { ok: false, error: slackError(me) };

  var ids = emails
    .map(function (email) { return slack('users.lookupByEmail?email=' + encodeURIComponent(email)); })
    .filter(function (res) { return res.ok; })
    .map(function (res) { return res.user.id; });

  if (!ids.length) return { ok: false, error: 'None of these guests are in this Slack workspace.' };

  var created = createUniqueChannel(name);

  // Many workspaces (Enterprise Grid especially) forbid channel creation outright.
  // A group DM is governed by no such policy, so fall back rather than fail.
  if (!created.ok && created.error === 'restricted_action') return openGroupDm(me, ids);
  if (!created.ok) return { ok: false, error: slackError(created) };

  // Whoever the token belongs to is already in the channel; inviting them fails the whole call.
  var invitees = ids.filter(function (id) { return id !== created.channel.creator; });
  if (invitees.length) {
    slack('conversations.invite', { channel: created.channel.id, users: invitees.join(',') });
  }

  return {
    ok: true,
    kind: 'channel',
    members: ids.length,
    url: conversationUrl(me, created.channel.id),
    summary: '#' + created.channel.name + ' created with ' + ids.length + ' member' + plural(ids.length)
  };
}

/** Fallback when channel creation is blocked. Group DMs hold nine people, the caller included. */
function openGroupDm(me, ids) {
  var others = ids.filter(function (id) { return id !== me.user_id; });

  if (!others.length) return { ok: false, error: 'No one else on this meeting is in Slack.' };
  if (others.length > 8) {
    return {
      ok: false,
      error: 'Channels are blocked in this workspace and a group DM holds only 9 — this meeting needs ' +
        (others.length + 1) + '.'
    };
  }

  var opened = slack('conversations.open', { users: others.join(','), return_im: false });
  if (!opened.ok) return { ok: false, error: slackError(opened) };

  return {
    ok: true,
    kind: 'group DM',
    members: others.length + 1,
    url: conversationUrl(me, opened.channel.id),
    summary: 'Group DM opened with ' + (others.length + 1) + ' people'
  };
}

/** Deep link to the conversation. Opens the desktop app when it's installed. */
function conversationUrl(me, channelId) {
  return me.url.replace(/\/$/, '') + '/archives/' + channelId;
}

/** Creates the channel, adding a numeric suffix if the name is already taken. */
function createUniqueChannel(name) {
  for (var attempt = 1; attempt <= 5; attempt++) {
    var suffix = attempt > 1 ? '-' + attempt : '';
    var res = slack('conversations.create', {
      name: name.slice(0, 80 - suffix.length) + suffix,
      is_private: true
    });
    if (res.ok || res.error !== 'name_taken') return res;
  }
  return { ok: false, error: 'name_taken' };
}

/* ---------- connecting Slack ---------- */

var SLACK_USER_SCOPES = 'groups:write,users:read,users:read.email,mpim:write';

/**
 * One Slack app serves every organisation, so each person authorises individually and
 * their token is stored against their own account. Nobody pastes a token, and no
 * administrator — theirs or ours — can read it.
 */
function slackAuthorizeUrl() {
  var clientId = PropertiesService.getScriptProperties().getProperty('SLACK_CLIENT_ID');
  if (!clientId) return '';

  var state = ScriptApp.newStateToken()
    .withMethod('slackCallback')
    .withTimeout(3600)
    .createToken();

  return 'https://slack.com/oauth/v2/authorize' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&user_scope=' + encodeURIComponent(SLACK_USER_SCOPES) +
    '&redirect_uri=' + encodeURIComponent(redirectUri()) +
    '&state=' + encodeURIComponent(state);
}

/** Apps Script routes this fixed URL back to slackCallback, so it is the same for everyone. */
function redirectUri() {
  return 'https://script.google.com/macros/d/' + ScriptApp.getScriptId() + '/usercallback';
}

/** Slack sends the user back here with a code; swap it for their token. */
function slackCallback(request) {
  var properties = PropertiesService.getScriptProperties();
  var response = JSON.parse(UrlFetchApp.fetch(SLACK_API + 'oauth.v2.access', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      client_id: properties.getProperty('SLACK_CLIENT_ID'),
      client_secret: properties.getProperty('SLACK_CLIENT_SECRET'),
      code: request.parameter.code,
      redirect_uri: redirectUri()
    }
  }).getContentText());

  var token = response.authed_user && response.authed_user.access_token;
  if (!response.ok || !token) {
    return page('Slack could not connect', slackConnectError(response.error));
  }

  PropertiesService.getUserProperties().setProperty('SLACK_USER_TOKEN', token);
  return page('Connected', 'Close this tab and reopen the meeting in Google Calendar.');
}

/**
 * Slack's OAuth errors are terse codes. Translate the ones a normal user can actually hit;
 * carry anything else through verbatim rather than inventing an explanation for it.
 */
function slackConnectError(code) {
  if (code === 'access_denied') {
    return 'The request was declined. If your workspace sends new apps to an admin for ' +
      'approval, you can try again once it is approved.';
  }
  if (code === 'invalid_scope' || code === 'invalid_scope_requested') {
    return 'Your workspace does not permit one of the permissions this add-on needs.';
  }
  return 'Slack said: ' + (code || 'no token returned') + '.';
}

/** Minimal styled page for the OAuth round trip — this is the only HTML the add-on serves. */
function page(title, body) {
  return HtmlService.createHtmlOutput(
    '<div style="font:400 14px/22px Roboto,Arial,sans-serif;color:#202124;padding:32px;max-width:32em">' +
    '<h2 style="font-weight:500;margin:0 0 8px">' + title + '</h2>' +
    '<p style="margin:0;color:#5f6368">' + body + '</p></div>');
}

/**
 * Revokes the token at Slack before forgetting it. Deleting our copy alone would leave a
 * live credential sitting in the workspace's installed-apps list with no way to reach it.
 */
function disconnectSlack() {
  if (slackToken()) {
    try {
      slack('auth.revoke');
    } catch (err) {
      // Already revoked, or Slack is unreachable. Drop our copy regardless.
    }
  }

  PropertiesService.getUserProperties().deleteProperty('SLACK_USER_TOKEN');
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText('Disconnected from Slack.'))
    .setNavigation(CardService.newNavigation().updateCard(onHomepage()))
    .build();
}

/* ---------- settings ---------- */

/**
 * Shown when the add-on is opened outside an event. Keeps setup in the UI rather than
 * sending people into Project Settings to hand-edit Script Properties.
 */
function onHomepage() {
  var section = CardService.newCardSection();

  if (!slackToken()) {
    var authorizeUrl = slackAuthorizeUrl();

    if (!authorizeUrl) {
      section.addWidget(CardService.newTextParagraph().setText(
        'This installation is missing its Slack credentials. Please report it at ' +
        'github.com/michael-whelan/calendar-to-slack/issues.'));
    } else {
      section
        .addWidget(CardService.newTextParagraph().setText(
          'Connect your Slack account once, and every meeting gets a one-click chat.'))
        .addWidget(CardService.newTextButton()
          .setText('Connect Slack')
          .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          .setOpenLink(CardService.newOpenLink().setUrl(authorizeUrl)))
        // Most workspaces route app installs through an admin. Saying so up front turns a
        // dead end into an expected wait, and it is the commonest reason connecting fails.
        .addWidget(CardService.newTextParagraph().setText(
          '<font color="#5f6368"><i>If your workspace requires approval for new apps, ' +
          'Slack will send your request to an admin and you can connect once they approve ' +
          'it.</i></font>'));
    }
  } else {
    var identity = slack('auth.test');
    section
      .addWidget(CardService.newTextParagraph().setText(identity.ok
        ? 'Connected as ' + identity.user + ' on ' + identity.team + '.'
        : 'Slack rejected the stored token: ' + identity.error))
      .addWidget(CardService.newTextButton()
        .setText('Disconnect')
        .setOnClickAction(CardService.newAction().setFunctionName('disconnectSlack')));
  }

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Calendar to Slack').setSubtitle('Version ' + VERSION))
    .addSection(section)
    .build();
}

/* ---------- the Calendar side panel ---------- */

/** Renders the side-panel card when a Calendar event is opened. */
function onEventOpen(e) {
  if (!slackToken()) return onHomepage();

  var emails = guestEmails(e);
  if (!emails.length) {
    return notice('No guests', 'This meeting has no guests to put in a channel.');
  }

  var section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(
      emails.length + ' guest' + plural(emails.length) + ' on this meeting. Anyone not in Slack is skipped.'))
    .addWidget(CardService.newTextInput()
      .setFieldName('channel')
      .setTitle('Channel name')
      .setValue(slugify(eventTitle(e))))
    .addWidget(CardService.newTextButton()
      .setText('Create private channel')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('createChannel')
        .setParameters({ emails: emails.join(',') })));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Create Slack channel'))
    .addSection(section)
    .build();
}

/** Card button handler. */
function createChannel(e) {
  var result = makeChannel(e.parameters.emails.split(','), e.formInput.channel || '');
  if (!result.ok) return toast(result.error);

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(result.summary + '.'))
    .setOpenLink(CardService.newOpenLink().setUrl(result.url))
    .build();
}

/**
 * NOT DEPLOYED in the published add-on. The manifest carries no `webapp` block, so nothing
 * below is reachable — it is kept for the Chrome extension, which is on hold.
 *
 * Before reviving it: the old deployment ran as USER_DEPLOYING with anonymous access, which
 * means every caller acted as whoever deployed it — one person's Slack token and one
 * person's calendar for the whole org. A public version has to run as USER_ACCESSING and
 * authenticate the caller (chrome.identity bearer token), not a shared secret.
 */

/* ---------- helpers ---------- */

/** Guest addresses on the event, minus meeting rooms and duplicates. */
function guestEmails(e) {
  var calendar = e.calendar || {};
  var emails = (calendar.attendees || [])
    .filter(function (guest) { return guest.email && !guest.resource; })
    .map(function (guest) { return guest.email; });

  if (calendar.organizer && calendar.organizer.email) emails.push(calendar.organizer.email);
  return dedupe(emails);
}

function dedupe(emails) {
  return emails.filter(function (email, i, all) { return email && all.indexOf(email) === i; });
}

/** Meeting title, used only to prefill the name field. Blank if the scope is absent. */
function eventTitle(e) {
  try {
    return Calendar.Events.get(e.calendar.calendarId, e.calendar.id).summary || '';
  } catch (err) {
    return '';
  }
}

/** One Slack call. A payload makes it a POST; without one it is a GET. */
function slack(method, payload) {
  var options = {
    headers: { Authorization: 'Bearer ' + slackToken() },
    muteHttpExceptions: true
  };
  if (payload) {
    options.method = 'post';
    options.contentType = 'application/json; charset=utf-8';
    options.payload = JSON.stringify(payload);
  }
  return JSON.parse(UrlFetchApp.fetch(SLACK_API + method, options).getContentText());
}

/** Slack names the missing scope on a rejection; carry that through instead of dropping it. */
function slackError(response) {
  return 'Slack rejected it: ' + response.error +
    (response.needed ? ' (needs ' + response.needed + ')' : '');
}

/**
 * Deliberately user-scoped only. Script properties are shared by everyone using a
 * published add-on, so a token stored there would make every user act as its owner.
 */
function slackToken() {
  return PropertiesService.getUserProperties().getProperty('SLACK_USER_TOKEN');
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function plural(count) {
  return count === 1 ? '' : 's';
}

function toast(text) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(text))
    .build();
}

function notice(title, text) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(title))
    .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(text)))
    .build();
}
