const API_BASE = 'https://agentcart.osskri.xyz/api/v1';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'agentcart-add',
    title: 'Add to AgentCart',
    contexts: ['image', 'page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'agentcart-add') return;

  const { handle } = await chrome.storage.sync.get(['handle']);
  if (!handle) {
    chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon.png', title: 'AgentCart', message: 'Set your handle in the extension popup first.' });
    return;
  }

  const item = {
    handle,
    title: tab?.title || 'Saved page',
    source: tab?.url ? new URL(tab.url).hostname : 'web',
    product_url: info.linkUrl || tab?.url,
    image_url: info.srcUrl,
    added_by: 'chrome-plugin',
  };

  const res = await fetch(`${API_BASE}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const data = await res.json();

  const msg = data.duplicate
    ? `"${data.item.title}" is already in the cart. Add another?`
    : `Added to cart: ${item.title}`;

  chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon.png', title: 'AgentCart', message: msg });
});