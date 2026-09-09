/**
 * Injects a "Slack channel" button into the Google Calendar event popup.
 *
 * Calendar's markup is not a public API, so everything below is best-effort and
 * expected to need adjusting when Google reskins the UI. All the fragile parts are
 * in readGuests() and readTitle(); nothing else depends on the DOM shape.
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

/** Meeting title, used to prefill the channel name. */
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

async function onClick(button, guests, title) {
  button.disabled = true;
  button.textContent = 'Creating…';

  let result;
  try {
    result = await chrome.runtime.sendMessage({ emails: guests, title });
  } catch (error) {
    result = { ok: false, error: error.message || 'Extension error' };
  }

  if (result && result.ok) {
    button.textContent = `#${result.channel} created`;
    return;
  }

  button.textContent = (result && result.error) || 'No reply from extension';
  button.title = button.textContent;
  button.disabled = false;
}

/** Adds the button to one popup, once. */
function decorate(popup) {
  if (popup.querySelector('.cal-to-slack')) return;

  const guests = readGuests(popup);
  if (!guests.length) return;

  const button = document.createElement('button');
  button.className = 'cal-to-slack';
  button.type = 'button';
  button.textContent = `Slack channel (${guests.length})`;
  styleButton(button);
  button.addEventListener('click', () => onClick(button, guests, readTitle(popup)));

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
