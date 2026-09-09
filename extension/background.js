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
    return await response.json();
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
