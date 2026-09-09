/**
 * Relays the button click to the Apps Script web app, which holds the Slack token.
 * The extension never sees a Slack credential.
 */

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  createChannel(message).then(respond);
  return true; // keep the message channel open for the async reply
});

async function createChannel({ emails, title }) {
  const { endpoint, secret } = await chrome.storage.sync.get(['endpoint', 'secret']);
  if (!endpoint) return { ok: false, error: 'Set the endpoint in extension options' };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      // text/plain dodges the CORS preflight, which Apps Script web apps don't answer.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, emails, title })
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
