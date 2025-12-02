// Background script is minimal since auto-dark-mode.js handles automatic application
// This script now only handles the popup functionality and storage

// Listen for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dark Mode extension installed');
});