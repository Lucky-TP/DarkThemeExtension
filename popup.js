const checkbox = document.getElementById("toggleBtn");

// 1. When popup opens, check if Dark Mode is currently active on the tab
// We run a tiny script on the tab to check if our style ID exists.
chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => !!document.getElementById("my-personal-dark-mode-style"),
  });

  // Update the checkbox state to match reality
  if (result && result.result) {
    checkbox.checked = true;
  }
});

// 2. When the toggle is clicked, run the content script
checkbox.addEventListener("change", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
});
