// Storage key for whitelist
const WHITELIST_KEY = 'darkModeWhitelist';

// Background script is simplified since auto-dark-mode.js handles the automatic application
// This script now only handles content script injection for manual toggles

// Get whitelist from storage
async function getWhitelist() {
  const result = await chrome.storage.sync.get([WHITELIST_KEY]);
  return result[WHITELIST_KEY] || [];
}

// Get domain from URL
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

// Listen for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dark Mode extension installed');
});

// Listen for messages from popup or content scripts if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getWhitelist') {
    getWhitelist().then(whitelist => {
      sendResponse({ whitelist: whitelist });
    });
    return true; // Keep the message channel open for async response
  }
});