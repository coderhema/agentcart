const API_BASE = 'https://agentcart.osskri.xyz/api/v1';
const storageKey = 'agentcart_handle';

async function init() {
  const saved = await chrome.storage.sync.get([storageKey]);
  if (saved[storageKey]) {
    document.getElementById('handle').value = saved[storageKey];
  }
}

document.getElementById('save').addEventListener('click', async () => {
  const handle = document.getElementById('handle').value.trim();
  await chrome.storage.sync.set({ [storageKey]: handle });
  loadCart(handle);
});

document.getElementById('add-current').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const handle = document.getElementById('handle').value.trim();
  if (!handle) { alert('Save your handle first.'); return; }

  let ctx = {};
  try {
    const r = await chrome.tabs.sendMessage(tab.id, { type: 'AGENTCART_GET_CONTEXT' });
    if (r) ctx = r;
  } catch (e) { /* content script may not be loaded */ }

  const res = await fetch(`${API_BASE}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle,
      title: ctx.title || tab?.title || 'Saved page',
      source: tab?.url ? new URL(tab.url).hostname : 'web',
      product_url: tab?.url,
      image_url: ctx.image || null,
      added_by: 'chrome-plugin',
    }),
  });
  const data = await res.json();
  alert(data.duplicate ? `Already in cart: ${data.item.title}` : `Added: ${data.item.title}`);
  loadCart(handle);
});

async function loadCart(handle) {
  const res = await fetch(`${API_BASE}/cart/${handle}`);
  const data = await res.json();
  const list = document.getElementById('items');
  list.innerHTML = '';
  (data.items || []).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.title} — ${item.price_usdc ?? '?'} USDC`;
    list.appendChild(li);
  });
  document.getElementById('total').textContent = `${data.total_usdc ?? 0} USDC`;
}

init();