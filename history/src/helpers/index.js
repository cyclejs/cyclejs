/* global window, navigator, location */

function supportsHistory() {
  const ua = navigator.userAgent

  if ((ua.indexOf(`Android 2.`) !== -1 ||
      ua.indexOf(`Android 4.0`) !== -1) &&
      ua.indexOf(`Mobile Safari`) !== -1 &&
      ua.indexOf(`Chrome`) === -1 &&
      ua.indexOf(`Windows Phone`) === -1)
  {
    {return false }
  }

   // Return the regular check
  return window.history && `pushState` in window.history
}

/*eslint-disable */
function which(e) {
  e = e || window.event;
  return null === e.which ? e.button : e.which;
}

/**
 * Check if `href` is the same origin.
 */

function sameOrigin(href) {
  let origin = location.protocol + '//' + location.hostname;
  if (location.port) origin += ':' + location.port;
  return (href && (0 === href.indexOf(origin)));
}


const filterLinks = (e) => {
  if (1 !== which(e)) return false

  if (e.metaKey || e.ctrlKey || e.shiftKey) return false
  if (e.defaultPrevented) return true

  // ensure link
  let el = e.target;
  while (el && 'A' !== el.nodeName) el = el.parentNode;
  if (!el || 'A' !== el.nodeName) return false

  // Ignore if tag has
  // 1. "download" attribute
  // 2. rel="external" attribute
  if (el.hasAttribute('download') ||
      el.getAttribute('rel') === 'external') return false

  // ensure non-hash for the same path
  const link = el.getAttribute('href');

  // Check for mailto: in the href
  if (link && link.indexOf('mailto:') > -1) return false;

  // check target
  if (el.target) return false;

  // x-origin
  if (!sameOrigin(el.href)) return false;

  e.preventDefault()
  return true
}
/*eslint-enable */

export {
  filterLinks,
  supportsHistory
}
