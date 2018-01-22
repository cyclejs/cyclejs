// From page/index.html
declare var isIE10: boolean;

if(isIE10) {
  (window as any).MutationObserver = require('mutation-observer');
}

if (!Element.prototype.matches) {
    Element.prototype.matches =
        (Element as any).prototype.matchesSelector ||
        (Element as any).prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        (Element as any).prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;
        };
}

import 'es6-symbol/implement';
import 'es6-map/implement';
import 'es6-set/implement';
