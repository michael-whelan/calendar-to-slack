/**
 * Relays the button click to the Apps Script web app, which holds the Slack token.
 * The extension never sees a Slack credential.
 */

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  createChannel(message).then((result) => {
    // Opened from here rather than the content script: a background tab creation
    // isn't subject to the popup blocker once the user gesture has expired.
    if (result.ok && result.url) chrome.tabs.create({ url: result.url });
    respond(result);
  });
  return true; // keep the message channel open for the async reply
});

async function createChannel({ eventId, emails, title }) {
  const { endpoint, secret } = await chrome.storage.sync.get(['endpoint', 'secret']);
  if (!endpoint) return { ok: false, error: 'Set the endpoint in extension options' };

  try {
    console.log('Posting to', endpoint, '| eventId:', eventId || '(none)', '| scraped guests:', emails.length);

    const response = await fetch(endpoint, {
      method: 'POST',
      // text/plain dodges the CORS preflight, which Apps Script web apps don't answer.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, eventId, emails, title }),
      // Without this a stalled request leaves the button on "Creating…" forever.
      signal: AbortSignal.timeout(25000)
    });

    // A login page or an Apps Script error comes back as HTML, not JSON — say so plainly.
    const body = await response.text();
    try {
      return JSON.parse(body);
    } catch (notJson) {
      console.error('Endpoint returned non-JSON:', response.status, body.slice(0, 500));
      return { ok: false, error: `Endpoint returned ${response.status}, not JSON — see service worker log` };
    }
  } catch (error) {
    console.error('Request failed:', error);
    return { ok: false, error: error.message };
  }
}
