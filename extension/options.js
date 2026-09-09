const fields = ['endpoint', 'secret'];

chrome.storage.sync.get(fields).then((saved) => {
  fields.forEach((name) => {
    document.getElementById(name).value = saved[name] || '';
  });
});

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({
    endpoint: document.getElementById('endpoint').value.trim(),
    secret: document.getElementById('secret').value
  });
  document.getElementById('status').textContent = 'Saved.';
});
