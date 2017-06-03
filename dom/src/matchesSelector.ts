function createMatchesSelector() {
  let vendor: any;
  try {
    const proto = Element.prototype;
    vendor =
      proto.matches ||
      (proto as any).matchesSelector ||
      proto.webkitMatchesSelector ||
      (proto as any).mozMatchesSelector ||
      proto.msMatchesSelector ||
      (proto as any).oMatchesSelector;
  } catch (err) {
    vendor = null;
  }

  return function match(elem: Element, selector: string): boolean {
    if (vendor) {
      return vendor.call(elem, selector);
    }
    const nodes = (elem.parentNode as Element).querySelectorAll(selector);
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] === elem) {
        return true;
      }
    }
    return false;
  };
}

export const matchesSelector = createMatchesSelector();
