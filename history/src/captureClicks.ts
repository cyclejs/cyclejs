import { StreamAdapter } from '@cycle/base';

const clickEvent = 'undefined' !== typeof document && document.ontouchstart ?
  'touchstart' : 'click';

function which(ev: any) {
  if (typeof window === 'undefined') {
    return false;
  }
  let e = ev || window.event;
  return e.which === null ? e.button : e.which;
}

function sameOrigin(href: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  return href && href.indexOf(window.location.origin) === 0;
}

function makeClickListener(push: Function) {
  return function clickListener(event: any) {
    if (which(event) !== 1) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }

    if (event.defaultPrevented) {
      return;
    }

    let element = event.target;
    while (element && element.nodeName !== 'A') {
      element = element.parentNode;
    }

    if (!element || element.nodeName !== 'A') { return; }

    if (element.hasAttribute('download') ||
      element.getAttribute('rel') === 'external') { return; }

    if (element.target) { return; }

    const link = element.getAttribute('href');

    if (link && link.indexOf('mailto:') > -1 || link.charAt(0) === '#') {
      return;
    }

    if (!sameOrigin(element.href)) {
      return;
    }

    event.preventDefault();
    const {pathname, search, hash = ''} = element;
    push(pathname + search + hash);
  };
}

function captureAnchorClicks(push: Function) {
  const listener = makeClickListener(push);
  if (typeof window !== 'undefined') {
    document.addEventListener(clickEvent, listener, false);
  }
}

export function captureClicks(historyDriver: (sink$: any, runStreamAdapter: StreamAdapter) => any) {
  return function historyDriverWithClickCaptuer(sink$: any, runStreamAdapter: StreamAdapter): any {
    const { observer, stream } = runStreamAdapter.makeSubject();

    captureAnchorClicks((pathname: string) => {
      observer.next({ type: 'push', pathname });
    });

    runStreamAdapter.streamSubscribe(sink$, observer);

    return historyDriver(stream, runStreamAdapter);
  };
}
