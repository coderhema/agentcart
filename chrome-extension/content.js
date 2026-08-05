// AgentCart content script
// Adds a lightweight "Add to cart" affordance on pages.

console.log('[AgentCart] content script loaded');

// Listen for a message from the extension popup to add an image to the cart.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'AGENTCART_GET_CONTEXT') {
    const img = document.querySelector('meta[property="og:image"]');
    const title = document.querySelector('meta[property="og:title"]');
    sendResponse({
      title: title?.getAttribute('content') || document.title,
      image: img?.getAttribute('content') || null,
    });
  }
  return true;
});