/**
 * Calendar to Slack — turns a meeting's guest list into a private Slack channel.
 * Guests with no Slack account are skipped silently.
 *
 * Two front doors, one implementation: the Calendar side-panel card (onEventOpen)
 * and a web-app endpoint (doPost) used by the Chrome extension.
 */

var SLACK_API = 'https://slack.com/api/';

/* ---------- core ---------- */

/** Resolves guests to Slack users, creates the private channel, invites them. */
function makeChannel(emails, name) {
  if (!slackToken()) return { ok: false, error: 'No Slack token configured.' };

  name = slugify(name);
  if (!name) return { ok: false, error: 'Give the channel a name first.' };

  var ids = emails
    .map(function (email) { return slack('users.lookupByEmail?email=' + encodeURIComponent(email)); })
    .filter(function (res) { return res.ok; })
    .map(function (res) { return res.user.id; });

  if (!ids.length) return { ok: false, error: 'None of these guests are in this Slack workspace.' };

  var created = createUniqueChannel(name);
  if (!created.ok) return { ok: false, error: 'Slack rejected it: ' + created.error };

  slack('conversations.invite', { channel: created.channel.id, users: ids.join(',') });
  return { ok: true, channel: created.channel.name, members: ids.length };
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

/* ---------- front door 1: the Calendar side panel ---------- */

/** Renders the side-panel card when a Calendar event is opened. */
function onEventOpen(e) {
  if (!slackToken()) {
    return notice('Not configured', 'Set SLACK_BOT_TOKEN in Script Properties — see the README.');
  }

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
  return toast(result.ok
    ? '#' + result.channel + ' created with ' + result.members + ' member' + plural(result.members) + '.'
    : result.error);
}

/* ---------- front door 2: the Chrome extension ---------- */

/**
 * Web-app endpoint. Deploy as a web app (execute as yourself, access "Anyone") and
 * set SHARED_SECRET in Script Properties — that secret is the only thing guarding it.
 */
function doPost(request) {
  var expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  var body;

  try {
    body = JSON.parse(request.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'Malformed request.' });
  }

  if (!expected || body.secret !== expected) return json({ ok: false, error: 'Unauthorized.' });
  return json(makeChannel(body.emails || [], body.title || ''));
}

/* ---------- helpers ---------- */

/** Guest addresses on the event, minus meeting rooms and duplicates. */
function guestEmails(e) {
  var calendar = e.calendar || {};
  var emails = (calendar.attendees || [])
    .filter(function (guest) { return guest.email && !guest.resource; })
    .map(function (guest) { return guest.email; });

  if (calendar.organizer && calendar.organizer.email) emails.push(calendar.organizer.email);
  return emails.filter(function (email, i, all) { return all.indexOf(email) === i; });
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

function slackToken() {
  return PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function plural(count) {
  return count === 1 ? '' : 's';
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
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
