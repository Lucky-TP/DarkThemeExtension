// This function checks if our dark mode style already exists.
// If it does, we remove it (toggle off).
// If it doesn't, we add it (toggle on).

(function () {
  const styleId = "my-personal-dark-mode-style";
  const existingStyle = document.getElementById(styleId);

  if (existingStyle) {
    // If enabled, turn it off
    existingStyle.remove();
  } else {
    // If disabled, turn it on
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
})();
