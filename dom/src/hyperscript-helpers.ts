import h from './hyperscript';

function isValidString(param: any): boolean {
  return typeof param === 'string' && param.length > 0;
}

function isSelector(param: any): boolean {
  return isValidString(param) && (param[0] === '.' || param[0] === '#');
}

function createTagFunction(tagName: string): Function {
  return function hyperscript(first: any, b?: any, c?: any) {
    if (isSelector(first)) {
      return h(tagName + first, b, c);
    } else {
      return h(tagName, first, b);
    }
  };
}

const TAG_NAMES = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base',
  'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
  'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'dfn', 'dir', 'div', 'dl',
  'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend',
  'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'p', 'param', 'pre', 'q', 'rp', 'rt',
  'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span',
  'strong', 'style', 'sub', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot',
  'th', 'thead', 'title', 'tr', 'u', 'ul', 'video', 'progress'
];

const exported = {TAG_NAMES, isSelector, createTagFunction};
TAG_NAMES.forEach(n => {
  exported[n] = createTagFunction(n);
});
export default (<any> exported);
