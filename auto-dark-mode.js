// This script runs automatically on every page at document_start
// It checks if the current domain is in the whitelist and applies dark mode immediately

// Storage key for whitelist
const WHITELIST_KEY = 'darkModeWhitelist';

// Get domain from URL
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

// Get current domain
const currentDomain = getDomainFromUrl(window.location.href);

if (currentDomain) {
  // Get whitelist from storage
  chrome.storage.sync.get([WHITELIST_KEY], (result) => {
    const whitelist = result[WHITELIST_KEY] || [];

    if (whitelist.includes(currentDomain)) {
      // Apply dark mode immediately for whitelisted domains
      const style = document.createElement("style");
      style.id = "my-personal-dark-mode-style";
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

      // Try to add to head immediately
      if (document.head) {
        document.head.appendChild(style);
      } else {
        // If head is not ready, wait for it with a more reliable method
        document.addEventListener('DOMContentLoaded', () => {
          if (!document.getElementById("my-personal-dark-mode-style")) {
            document.head.appendChild(style);
          }
        });

        // Also try with a mutation observer for earliest possible insertion
        const observer = new MutationObserver(() => {
          if (document.head && !document.getElementById("my-personal-dark-mode-style")) {
            document.head.appendChild(style);
            observer.disconnect();
          }
        });

        observer.observe(document, {
          childList: true,
          subtree: true
        });
      }
    }
  });
}