/**
 * Injects a "Slack channel" button into the Google Calendar event popup.
 *
 * Calendar's markup is not a public API, so everything below is best-effort and
 * expected to need adjusting when Google reskins the UI. All the fragile parts are
 * in the read* functions; nothing else depends on the DOM shape.
 *
 * The popup stops rendering individual guests on large meetings, so the event id is
 * the preferred payload — the server reads the real attendee list from Calendar.
 * Scraped emails are only a fallback for when no id can be found.
 */

const EMAIL = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;
const EMAIL_ATTRIBUTES = ['data-hovercard-id', 'data-email', 'email'];

/** Guest addresses inside the popup, minus meeting rooms and duplicates. */
function readGuests(popup) {
  const found = new Set();

  popup.querySelectorAll(EMAIL_ATTRIBUTES.map((name) => `[${name}]`).join(',')).forEach((element) => {
    for (const name of EMAIL_ATTRIBUTES) {
      const value = (element.getAttribute(name) || '').trim().toLowerCase();
      if (EMAIL.test(value)) found.add(value);
    }
  });

  return [...found].filter((email) => !email.endsWith('resource.calendar.google.com'));
}

/** Calendar's own id for the event, if it appears anywhere we can reach. */
function readEventId(popup) {
  return (
    popup.getAttribute('data-eventid') ||
    (popup.querySelector('[data-eventid]') || {}).dataset?.eventid ||
    (document.querySelector('[data-eventid][aria-selected="true"]') || {}).dataset?.eventid ||
    ''
  );
}

/** The guest count Calendar prints, e.g. "23 guests" — the truth when the list is collapsed. */
function readStatedGuestCount(popup) {
  const match = popup.innerText.match(/(\d+)\s+guests?/i);
  return match ? Number(match[1]) : 0;
}

function readTitle(popup) {
  const heading = popup.querySelector('[role="heading"], h1, h2');
  return heading ? heading.textContent.trim() : '';
}

function styleButton(button) {
  Object.assign(button.style, {
    margin: '8px 0 0 0',
    padding: '6px 14px',
    border: '1px solid #747775',
    borderRadius: '16px',
    background: 'transparent',
    color: '#0b57d0',
    font: '500 14px/20px Roboto, Arial, sans-serif',
    cursor: 'pointer'
  });
}

async function onClick(button, payload) {
  button.disabled = true;
  button.textContent = 'Creating…';

  let result;
  try {
    result = await chrome.runtime.sendMessage(payload);
  } catch (error) {
    result = { ok: false, error: error.message || 'Extension error' };
  }

  button.textContent = (result && (result.summary || result.error)) || 'No reply from extension';
  button.title = button.textContent;
  if (!result || !result.ok) button.disabled = false;
}

/** Adds the button to one popup, once. */
function decorate(popup) {
  if (popup.querySelector('.cal-to-slack')) return;

  const guests = readGuests(popup);
  const eventId = readEventId(popup);
  const stated = readStatedGuestCount(popup);
  if (!guests.length && !eventId) return;

  const button = document.createElement('button');
  button.className = 'cal-to-slack';
  button.type = 'button';
  styleButton(button);

  // Without an id, a collapsed guest list would silently create the wrong conversation
  // — a 1:1 with the organiser instead of the group. Refuse rather than get it wrong.
  if (!eventId && stated > guests.length) {
    button.textContent = 'Guests hidden — use the sidebar';
    button.disabled = true;
  } else {
    button.textContent = `Slack channel (${stated || guests.length})`;
    button.addEventListener('click', () =>
      onClick(button, { eventId, emails: guests, title: readTitle(popup) }));
  }

  const heading = popup.querySelector('[role="heading"], h1, h2');
  const anchor = (heading && heading.parentElement) || popup;
  anchor.appendChild(button);
}

let pending = null;

/** Calendar rebuilds the DOM constantly, so watch and debounce rather than hook events. */
new MutationObserver(() => {
  clearTimeout(pending);
  pending = setTimeout(() => document.querySelectorAll('[role="dialog"]').forEach(decorate), 150);
}).observe(document.body, { childList: true, subtree: true });
