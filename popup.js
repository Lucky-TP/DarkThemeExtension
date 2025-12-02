// Storage key for whitelist
const WHITELIST_KEY = 'darkModeWhitelist';

// DOM Elements
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const currentDomain = document.getElementById('currentDomain');
const whitelistToggleBtn = document.getElementById('whitelistToggleBtn');
const whitelistList = document.getElementById('whitelistList');

// Current tab info
let currentTabInfo = null;

// Get current domain from URL
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

// Get whitelist from storage
async function getWhitelist() {
  const result = await chrome.storage.sync.get([WHITELIST_KEY]);
  return result[WHITELIST_KEY] || [];
}

// Save whitelist to storage
async function saveWhitelist(whitelist) {
  await chrome.storage.sync.set({ [WHITELIST_KEY]: whitelist });
}

// Add domain to whitelist
async function addToWhitelist(domain) {
  const whitelist = await getWhitelist();
  if (!whitelist.includes(domain)) {
    whitelist.push(domain);
    await saveWhitelist(whitelist);
    updateWhitelistDisplay();
    return true;
  }
  return false;
}

// Remove domain from whitelist
async function removeFromWhitelist(domain) {
  const whitelist = await getWhitelist();
  const index = whitelist.indexOf(domain);
  if (index > -1) {
    whitelist.splice(index, 1);
    await saveWhitelist(whitelist);
    updateWhitelistDisplay();
    return true;
  }
  return false;
}

// Check if domain is in whitelist
async function isWhitelisted(domain) {
  const whitelist = await getWhitelist();
  return whitelist.includes(domain);
}

// Update whitelist display
function updateWhitelistDisplay() {
  getWhitelist().then(whitelist => {
    if (whitelist.length === 0) {
      whitelistList.innerHTML = '<div class="empty-whitelist">No whitelisted domains yet</div>';
    } else {
      whitelistList.innerHTML = whitelist
        .map(domain => `
          <div class="whitelist-item">
            <span>${domain}</span>
            <button data-domain="${domain}">Remove</button>
          </div>
        `)
        .join('');

      // Add remove event listeners
      document.querySelectorAll('.whitelist-item button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const domain = e.target.dataset.domain;
          await removeFromWhitelist(domain);
          updateCurrentDomainDisplay();
        });
      });
    }
  });
}

// Update current domain display and button state
async function updateCurrentDomainDisplay() {
  if (!currentTabInfo) return;

  const domain = getDomainFromUrl(currentTabInfo.url);
  if (domain) {
    currentDomain.textContent = domain;

    const isWhitelistedDomain = await isWhitelisted(domain);

    if (isWhitelistedDomain) {
      whitelistToggleBtn.textContent = 'Remove from Whitelist';
      whitelistToggleBtn.classList.add('remove');
    } else {
      whitelistToggleBtn.textContent = 'Add to Whitelist';
      whitelistToggleBtn.classList.remove('remove');
    }
  } else {
    currentDomain.textContent = 'Not a website';
    whitelistToggleBtn.style.display = 'none';
  }
}

// Check if dark mode is currently active
async function isDarkModeActive(tabId) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => !!document.getElementById("my-personal-dark-mode-style"),
  });
  return result && result.result;
}

// Apply dark mode
function applyDarkMode() {
  const styleId = "my-personal-dark-mode-style";
  const existingStyle = document.getElementById(styleId);

  if (!existingStyle) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      html {
        /* Invert colors (white -> black) and rotate hue so blue doesn't turn orange */
        filter: invert(1) hue-rotate(180deg) !important;
        /* Smooth transition */
        transition: filter 0.3s ease !important;
      }

      /* Re-invert media so images/videos look normal, not like ghosts */
      img, video, iframe, canvas, svg {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      /* Optional: Fix for background images that might look weird */
      div[style*="background-image"] {
         filter: invert(1) hue-rotate(180deg) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Remove dark mode
function removeDarkMode() {
  const styleId = "my-personal-dark-mode-style";
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
}

// Toggle dark mode
async function toggleDarkMode() {
  if (!currentTabInfo) return;

  const isActive = await isDarkModeActive(currentTabInfo.id);

  if (isActive) {
    chrome.scripting.executeScript({
      target: { tabId: currentTabInfo.id },
      func: removeDarkMode,
    });
    updateToggleDisplay(false);
  } else {
    chrome.scripting.executeScript({
      target: { tabId: currentTabInfo.id },
      func: applyDarkMode,
    });
    updateToggleDisplay(true);
  }
}

// Update toggle button display
function updateToggleDisplay(isActive) {
  if (isActive) {
    toggleBtn.classList.add('active');
    toggleText.textContent = 'ON';
  } else {
    toggleBtn.classList.remove('active');
    toggleText.textContent = 'OFF';
  }
}

// Auto-apply dark mode for whitelisted domains (immediate, no animation)
async function autoApplyDarkMode() {
  if (!currentTabInfo) return;

  const domain = getDomainFromUrl(currentTabInfo.url);
  if (domain && await isWhitelisted(domain)) {
    const isActive = await isDarkModeActive(currentTabInfo.id);
    if (!isActive) {
      chrome.scripting.executeScript({
        target: { tabId: currentTabInfo.id },
        func: () => {
          const styleId = "my-personal-dark-mode-style";
          const existingStyle = document.getElementById(styleId);

          if (!existingStyle) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = `
              html {
                /* Invert colors (white -> black) and rotate hue so blue doesn't turn orange */
                filter: invert(1) hue-rotate(180deg) !important;
                /* NO transition for immediate application */
              }

              /* Re-invert media so images/videos look normal, not like ghosts */
              img, video, iframe, canvas, svg {
                filter: invert(1) hue-rotate(180deg) !important;
              }

              /* Optional: Fix for background images that might look weird */
              div[style*="background-image"] {
                 filter: invert(1) hue-rotate(180deg) !important;
              }
            `;
            document.head.appendChild(style);
          }
        },
      });
      updateToggleDisplay(true);
    }
  }
}

// Initialize popup
async function initializePopup() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabInfo = tab;

  if (currentTabInfo) {
    // Update current domain display
    await updateCurrentDomainDisplay();

    // Check if dark mode is active
    const isActive = await isDarkModeActive(currentTabInfo.id);
    updateToggleDisplay(isActive);

    // Auto-apply dark mode if domain is whitelisted
    await autoApplyDarkMode();
  }

  // Update whitelist display
  updateWhitelistDisplay();
}

// Event listeners
toggleBtn.addEventListener('click', toggleDarkMode);

whitelistToggleBtn.addEventListener('click', async () => {
  if (!currentTabInfo) return;

  const domain = getDomainFromUrl(currentTabInfo.url);
  if (domain) {
    const isWhitelistedDomain = await isWhitelisted(domain);

    if (isWhitelistedDomain) {
      await removeFromWhitelist(domain);
    } else {
      await addToWhitelist(domain);
    }

    await updateCurrentDomainDisplay();
  }
});

// Initialize when popup opens
initializePopup();