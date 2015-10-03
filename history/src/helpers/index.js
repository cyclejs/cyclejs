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

function which(event) {
  let _event = event || window.event
  _event = _event.which ? _event.button : _event.which
  return _event
}

const sameOrigin = (href) => {
  let origin = `${location.protocol}//${location.hostname}`
  if (location.port) {
    origin += `:${location.port}`
  }
  let _href = href && href.indexOf(origin) === 0
  return _href
}

function testEvent(event) {
  if (which(event) !== 1) {return false }
  if (event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.defaultPrevented)
  {
    return false
  }
  return true
}

function validateLink(target) {
  let validTarget = target
  while (validTarget && `A` !== validTarget.nodeName) {
    validTarget = validTarget.parentNode
  }
  if (!validTarget || `A` !== validTarget.nodeName) {return false}
  return validTarget
}

function isDownloadLink(target) {
  if (target.hasAttribute(`download`)) {return true}
  return false
}

function isExternalLink(target) {
  if (target.getAttribute(`rel`) === `external`) {return true}
  return false
}

function isCurrentPath(target) {
  if (target.pathname === location.pathname &&
    (target.hash || target.getAttribute(`href`) === `#`))
  {
    return true
  }
  return false
}

function isMailLink(target) {
  if (target.getAttribute(`href`) &&
    target.getAttribute(`href`).indexOf(`mailto:`) > -1)
  {
    return true
  }
  return false
}

function testTarget(target) {
  // Make sure you`re grabbing the link not a child.
  const _target = validateLink(target)
  if (_target === false) {return false}
  if (isDownloadLink(_target)) {return false}
  if (isExternalLink(_target)) {return false}
  if (_target.target) {return false}
  if (!sameOrigin(_target.href)) {return false}
  if (isCurrentPath(_target)) {return false}
  if (isMailLink(_target)) {return false}
  return true
}

function filterLinks(event) {
  if (!testEvent(event)) {return false}
  if (!testTarget(event.target)) {return false}
  return true
}

export {
  filterLinks,
  supportsHistory
}
