// tslint:disable:max-file-line-count
import {h} from 'snabbdom/h';
import {VNode, VNodeData} from 'snabbdom/vnode';

function isValidString(param: any): boolean {
  return typeof param === 'string' && param.length > 0;
}

function isSelector(param: any): boolean {
  return isValidString(param) && (param[0] === '.' || param[0] === '#');
}

function createTagFunction(tagName: string): Function {
  return function hyperscript(a: any, b?: any, c?: any): VNode {
    const hasA = typeof a !== 'undefined';
    const hasB = typeof b !== 'undefined';
    const hasC = typeof c !== 'undefined';
    if (isSelector(a)) {
      if (hasB && hasC) {
        return h(tagName + a, b, c);
      } else if (hasB) {
        return h(tagName + a, b);
      } else {
        return h(tagName + a, {});
      }
    } else if (hasC) {
      return h(tagName + a, b, c);
    } else if (hasB) {
      return h(tagName, a, b);
    } else if (hasA) {
      return h(tagName, a);
    } else {
      return h(tagName, {});
    }
  };
}

const SVG_TAG_NAMES = [
  'a',
  'altGlyph',
  'altGlyphDef',
  'altGlyphItem',
  'animate',
  'animateColor',
  'animateMotion',
  'animateTransform',
  'circle',
  'clipPath',
  'colorProfile',
  'cursor',
  'defs',
  'desc',
  'ellipse',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotlight',
  'feTile',
  'feTurbulence',
  'filter',
  'font',
  'fontFace',
  'fontFaceFormat',
  'fontFaceName',
  'fontFaceSrc',
  'fontFaceUri',
  'foreignObject',
  'g',
  'glyph',
  'glyphRef',
  'hkern',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'metadata',
  'missingGlyph',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'script',
  'set',
  'stop',
  'style',
  'switch',
  'symbol',
  'text',
  'textPath',
  'title',
  'tref',
  'tspan',
  'use',
  'view',
  'vkern',
];

const svg = createTagFunction('svg');

SVG_TAG_NAMES.forEach(tag => {
  svg[tag] = createTagFunction(tag);
});

const TAG_NAMES = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'details',
  'dfn',
  'dir',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'meta',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'u',
  'ul',
  'video',
];

const exported = {
  SVG_TAG_NAMES,
  TAG_NAMES,
  svg,
  isSelector,
  createTagFunction,
};
TAG_NAMES.forEach(n => {
  exported[n] = createTagFunction(n);
});
export default (exported as any) as HyperScriptHelpers;

export type Children = Array<VNode | string | null>;
export type Properties = any; //VNodeData // does not work yet, because of https://github.com/snabbdom/snabbdom/pull/325
export interface HyperScriptHelperFn {
  (): VNode;
  (textOrSelector: string): VNode;
  (children: Children): VNode;
  (properties: Properties): VNode;
  (selector: string, children: Children): VNode;
  (selector: string, text: string): VNode;
  (selector: string, properties: Properties): VNode;
  (properties: Properties, children: Children): VNode;
  (properties: Properties, text: string): VNode;
  (selector: string, properties: Properties, text: string): VNode;
  (selector: string, properties: Properties, children: Children): VNode;
}

export interface SVGHelperFn extends HyperScriptHelperFn {
  a: HyperScriptHelperFn;
  altGlyph: HyperScriptHelperFn;
  altGlyphDef: HyperScriptHelperFn;
  altGlyphItem: HyperScriptHelperFn;
  animate: HyperScriptHelperFn;
  animateColor: HyperScriptHelperFn;
  animateMotion: HyperScriptHelperFn;
  animateTransform: HyperScriptHelperFn;
  circle: HyperScriptHelperFn;
  clipPath: HyperScriptHelperFn;
  colorProfile: HyperScriptHelperFn;
  cursor: HyperScriptHelperFn;
  defs: HyperScriptHelperFn;
  desc: HyperScriptHelperFn;
  ellipse: HyperScriptHelperFn;
  feBlend: HyperScriptHelperFn;
  feColorMatrix: HyperScriptHelperFn;
  feComponentTransfer: HyperScriptHelperFn;
  feComposite: HyperScriptHelperFn;
  feConvolveMatrix: HyperScriptHelperFn;
  feDiffuseLighting: HyperScriptHelperFn;
  feDisplacementMap: HyperScriptHelperFn;
  feDistantLight: HyperScriptHelperFn;
  feFlood: HyperScriptHelperFn;
  feFuncA: HyperScriptHelperFn;
  feFuncB: HyperScriptHelperFn;
  feFuncG: HyperScriptHelperFn;
  feFuncR: HyperScriptHelperFn;
  feGaussianBlur: HyperScriptHelperFn;
  feImage: HyperScriptHelperFn;
  feMerge: HyperScriptHelperFn;
  feMergeNode: HyperScriptHelperFn;
  feMorphology: HyperScriptHelperFn;
  feOffset: HyperScriptHelperFn;
  fePointLight: HyperScriptHelperFn;
  feSpecularLighting: HyperScriptHelperFn;
  feSpotlight: HyperScriptHelperFn;
  feTile: HyperScriptHelperFn;
  feTurbulence: HyperScriptHelperFn;
  filter: HyperScriptHelperFn;
  font: HyperScriptHelperFn;
  fontFace: HyperScriptHelperFn;
  fontFaceFormat: HyperScriptHelperFn;
  fontFaceName: HyperScriptHelperFn;
  fontFaceSrc: HyperScriptHelperFn;
  fontFaceUri: HyperScriptHelperFn;
  foreignObject: HyperScriptHelperFn;
  g: HyperScriptHelperFn;
  glyph: HyperScriptHelperFn;
  glyphRef: HyperScriptHelperFn;
  hkern: HyperScriptHelperFn;
  image: HyperScriptHelperFn;
  line: HyperScriptHelperFn;
  linearGradient: HyperScriptHelperFn;
  marker: HyperScriptHelperFn;
  mask: HyperScriptHelperFn;
  metadata: HyperScriptHelperFn;
  missingGlyph: HyperScriptHelperFn;
  mpath: HyperScriptHelperFn;
  path: HyperScriptHelperFn;
  pattern: HyperScriptHelperFn;
  polygon: HyperScriptHelperFn;
  polyline: HyperScriptHelperFn;
  radialGradient: HyperScriptHelperFn;
  rect: HyperScriptHelperFn;
  script: HyperScriptHelperFn;
  set: HyperScriptHelperFn;
  stop: HyperScriptHelperFn;
  style: HyperScriptHelperFn;
  switch: HyperScriptHelperFn;
  symbol: HyperScriptHelperFn;
  text: HyperScriptHelperFn;
  textPath: HyperScriptHelperFn;
  title: HyperScriptHelperFn;
  tref: HyperScriptHelperFn;
  tspan: HyperScriptHelperFn;
  use: HyperScriptHelperFn;
  view: HyperScriptHelperFn;
  vkern: HyperScriptHelperFn;
}

export interface HyperScriptHelpers {
  svg: SVGHelperFn;
  a: HyperScriptHelperFn;
  abbr: HyperScriptHelperFn;
  address: HyperScriptHelperFn;
  area: HyperScriptHelperFn;
  article: HyperScriptHelperFn;
  aside: HyperScriptHelperFn;
  audio: HyperScriptHelperFn;
  b: HyperScriptHelperFn;
  base: HyperScriptHelperFn;
  bdi: HyperScriptHelperFn;
  bdo: HyperScriptHelperFn;
  blockquote: HyperScriptHelperFn;
  body: HyperScriptHelperFn;
  br: HyperScriptHelperFn;
  button: HyperScriptHelperFn;
  canvas: HyperScriptHelperFn;
  caption: HyperScriptHelperFn;
  cite: HyperScriptHelperFn;
  code: HyperScriptHelperFn;
  col: HyperScriptHelperFn;
  colgroup: HyperScriptHelperFn;
  dd: HyperScriptHelperFn;
  del: HyperScriptHelperFn;
  details: HyperScriptHelperFn;
  dfn: HyperScriptHelperFn;
  dir: HyperScriptHelperFn;
  div: HyperScriptHelperFn;
  dl: HyperScriptHelperFn;
  dt: HyperScriptHelperFn;
  em: HyperScriptHelperFn;
  embed: HyperScriptHelperFn;
  fieldset: HyperScriptHelperFn;
  figcaption: HyperScriptHelperFn;
  figure: HyperScriptHelperFn;
  footer: HyperScriptHelperFn;
  form: HyperScriptHelperFn;
  h1: HyperScriptHelperFn;
  h2: HyperScriptHelperFn;
  h3: HyperScriptHelperFn;
  h4: HyperScriptHelperFn;
  h5: HyperScriptHelperFn;
  h6: HyperScriptHelperFn;
  head: HyperScriptHelperFn;
  header: HyperScriptHelperFn;
  hgroup: HyperScriptHelperFn;
  hr: HyperScriptHelperFn;
  html: HyperScriptHelperFn;
  i: HyperScriptHelperFn;
  iframe: HyperScriptHelperFn;
  img: HyperScriptHelperFn;
  input: HyperScriptHelperFn;
  ins: HyperScriptHelperFn;
  kbd: HyperScriptHelperFn;
  keygen: HyperScriptHelperFn;
  label: HyperScriptHelperFn;
  legend: HyperScriptHelperFn;
  li: HyperScriptHelperFn;
  link: HyperScriptHelperFn;
  main: HyperScriptHelperFn;
  map: HyperScriptHelperFn;
  mark: HyperScriptHelperFn;
  menu: HyperScriptHelperFn;
  meta: HyperScriptHelperFn;
  nav: HyperScriptHelperFn;
  noscript: HyperScriptHelperFn;
  object: HyperScriptHelperFn;
  ol: HyperScriptHelperFn;
  optgroup: HyperScriptHelperFn;
  option: HyperScriptHelperFn;
  p: HyperScriptHelperFn;
  param: HyperScriptHelperFn;
  pre: HyperScriptHelperFn;
  progress: HyperScriptHelperFn;
  q: HyperScriptHelperFn;
  rp: HyperScriptHelperFn;
  rt: HyperScriptHelperFn;
  ruby: HyperScriptHelperFn;
  s: HyperScriptHelperFn;
  samp: HyperScriptHelperFn;
  script: HyperScriptHelperFn;
  section: HyperScriptHelperFn;
  select: HyperScriptHelperFn;
  small: HyperScriptHelperFn;
  source: HyperScriptHelperFn;
  span: HyperScriptHelperFn;
  strong: HyperScriptHelperFn;
  style: HyperScriptHelperFn;
  sub: HyperScriptHelperFn;
  summary: HyperScriptHelperFn;
  sup: HyperScriptHelperFn;
  table: HyperScriptHelperFn;
  tbody: HyperScriptHelperFn;
  td: HyperScriptHelperFn;
  textarea: HyperScriptHelperFn;
  tfoot: HyperScriptHelperFn;
  th: HyperScriptHelperFn;
  thead: HyperScriptHelperFn;
  time: HyperScriptHelperFn;
  title: HyperScriptHelperFn;
  tr: HyperScriptHelperFn;
  u: HyperScriptHelperFn;
  ul: HyperScriptHelperFn;
  video: HyperScriptHelperFn;
}
