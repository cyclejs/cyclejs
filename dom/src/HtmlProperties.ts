// tslint:disable:max-file-line-count
// tslint:disable:no-empty-interface

export interface NodeProperties {
  nodeValue?: string | null;
  textContent?: string | null;
}

export interface ElementProperties extends NodeProperties {
  className?: string;
  id?: string;
  innerHTML?: string;
  scrollLeft?: number;
  scrollTop?: number;
  slot?: string;
}

export interface HTMLElementProperties extends ElementProperties {
  accessKey?: string;
  contentEditable?: string;
  dir?: string;
  draggable?: boolean;
  hidden?: boolean;
  hideFocus?: boolean;
  innerText?: string;
  lang?: string;
  outerText?: string;
  spellcheck?: boolean;
  tabIndex?: boolean;
  title?: string;
}

export interface HTMLAnchorElementProperties {
  Methods?: string;
  charset?: string;
  coords?: string;
  download?: string;
  hash?: string;
  host?: string;
  hostname?: string;
  href?: string;
  hreflang?: string;
  name?: string;
  pathname?: string;
  port?: string;
  protocol?: string;
  rel?: string;
  rev?: string;
  search?: string;
  shape?: string;
  target?: string;
  text?: string;
  type?: string;
  urn?: string;
}

export interface HTMLAppletElementProperties {
  align?: string;
  alt?: string;
  altHtml?: string;
  archive?: string;
  border?: string;
  code?: string;
  codeBase?: string;
  codeType?: string;
  data?: string;
  declare?: boolean;
  height?: string;
  hspace?: number;
  name?: string;
  object?: string | null;
  standby?: string;
  type?: string;
  vspace?: number;
  width?: number;
}

export interface HTMLAreaElementProperties {
  alt?: string;
  coords?: string;
  download?: string;
  hash?: string;
  host?: string;
  hostname?: string;
  href?: string;
  noHref?: string;
  pathname?: string;
  port?: string;
  protocol?: string;
  rel?: string;
  search?: string;
  shape?: string;
  target?: string;
}


export interface HTMLAudioElementProperties { }

export interface HTMLBRElementProperties {
  clear?: string;
}

export interface HTMLBaseElementProperties {
  href?: string;
  target?: string;
}

export interface HTMLBaseFontElementProperties {
  face?: string;
  size?: number;
}

export interface HTMLBodyElementProperties {
  aLink?: any;
  background?: string;
  bgColor?: any;
  bgProperties?: string;
  link?: any;
  noWrap?: boolean;
  text?: any;
  vLink?: any;
}

export interface HTMLButtonElementProperties {
  autofocus?: boolean;
  disabled?: boolean;
  formAction?: string;
  formEnctype?: string;
  formMethod?: string;
  formNoValidate?: string;
  formTarget?: string;
  name?: string;
  status?: any;
  type?: string;
  value?: string;
}

export interface HTMLCanvasElementProperties {
  height?: number;
  width?: number;
}

export interface HTMLDListElementProperties {
  compact?: boolean;
}

export interface HTMLDataElementProperties {
  value?: string;
}

export interface HTMLDataListElementProperties {
  options?: HTMLCollectionOf<HTMLOptionElement>;
}

export interface HTMLDirectoryElementProperties {
  compact?: boolean;
}

export interface HTMLDivElementProperties {
  align?: string;
  noWrap?: boolean;
}

export interface HTMLEmbedElementProperties {
  height?: string;
  hidden?: any;
  msPlayToDisabled?: boolean;
  msPlayToPreferredSourceUri?: string;
  msPlayToPrimary?: boolean;
  name?: string;
  src?: string;
  units?: string;
  width?: string;
}

export interface HTMLFieldSetElementProperties {
  align?: string;
  disabled?: boolean;
  name?: string;
}

export interface HTMLFontElementProperties {
  face?: string;
}

export interface HTMLFormElementProperties {
  acceptCharset?: string;
  action?: string;
  autocomplete?: string;
  encoding?: string;
  enctype?: string;
  method?: string;
  name?: string;
  noValidate?: boolean;
  target?: string;
}

export interface HTMLFrameElementProperties {
  border?: string;
  borderColor?: any;
  frameBorder?: string;
  frameSpacing?: any;
  height?: string | number;
  longDesc?: string;
  marginHeight?: string;
  marginWidth?: string;
  name?: string;
  noResize?: boolean;
  scrolling?: string;
  src?: string;
  width?: string | number;
}

export interface HTMLFrameSetElementProperties {
  border?: string;
  borderColor?: string;
  cols?: string;
  frameBorder?: string;
  frameSpacing?: any;
  name?: string;
  rows?: string;
}

export interface HTMLHRElementProperties {
  align?: string;
  noShade?: boolean;
  width?: number;
}

export interface HTMLHeadElementProperties {
  profile?: string;
}

export interface HTMLHeadingElementProperties {
  align?: string;
}

export interface HTMLHtmlElementProperties {
  version?: string;
}

export interface HTMLIFrameElementProperties {
  align?: string;
  allowFullscreen?: boolean;
  allowPaymentRequest?: boolean;
  border?: string;
  frameBorder?: string;
  frameSpacing?: any;
  height?: string;
  hspace?: number;
  longDesc?: string;
  marginHeight?: string;
  marginWidth?: string;
  name?: string;
  noResize?: boolean;
  scrolling?: string;
  src?: string;
  vspace?: number;
  width?: string;
}

export interface HTMLImageElementProperties {
  align?: string;
  alt?: string;
  border?: string;
  crossOrigin?: string | null;
  height?: number;
  hspace?: number;
  isMap?: boolean;
  longDesc?: string;
  lowsrc?: string;
  msPlayToDisabled?: boolean;
  msPlayToPreferredSourceUri?: string;
  msPlayToPrimary?: boolean;
  name?: string;
  sizes?: string;
  src?: string;
  srcset?: string;
  useMap?: string;
  vspace?: number;
  width?: number;
}

export interface HTMLInputElementProperties {
  accept?: string;
  align?: string;
  alt?: string;
  autocomplete?: string;
  autofocus?: boolean;
  border?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  formAction?: string;
  formEnctype?: string;
  formMethod?: string;
  formNoValidate?: string;
  formTarget?: string;
  height?: string;
  hspace?: number;
  indeterminate?: boolean;
  max?: string;
  maxLength?: number;
  min?: string;
  minLength?: number;
  multiple?: boolean;
  name?: string;
  pattern?: string;
  placeholder?: string;
  readOnly?: string;
  required?: boolean;
  selectionDirection?: string;
  selectionEnd?: number;
  selectionStart?: number;
  size?: number;
  src?: string;
  status?: boolean;
  step?: string;
  type?: string;
  useMap?: string;
  value?: string;
  valueAsDate?: Date;
  valueAsNumber?: number;
  vspace?: number;
  webkitdirectory?: boolean;
  width?: string;
}

export interface HTMLLIElementProperties {
  type?: string;
  value?: number;
}

export interface HTMLLabelElementProperties {
  htmlFor?: string;
}

export interface HTMLLegendElementProperties {
  align?: string;
}

export interface HTMLLinkElementProperties {
  charset?: string;
  disabled?: boolean;
  href?: string;
  hreflang?: string;
  media?: string;
  rel?: string;
  rev?: string;
  target?: string
  type?: string;
  import?: Document;
  integrity?: string;
}

export interface HTMLMapElementProperties {
  name?: string;
}

export interface HTMLMarqueeElementProperties {
  behavior?: string;
  bgColor?: any;
  direction?: string;
  height?: string;
  hspace?: number;
  loop?: number;
  scrollAmount?: number;
  scrollDelay?: number;
  trueSpeed?: boolean;
  vspace?: number;
  width?: string;
}

export interface HTMLMediaElementProperties {
  autoplay?: boolean;
  controls?: boolean;
  crossOrigin?: string | null;
  currentTime?: number;
  defaultMuted?: boolean;
  defaultPlaybackRate?: number;
  loop?: boolean;
  msAudioCategory?: string;
  msAudioDeviceType?: string;
  msPlayToDisabled?: boolean;
  msPlayToPreferredSourceUri?: string;
  msPlayToPrimary?: string;
  msRealTime?: boolean;
  muted?: boolean;
  playbackRate?: number;
  preload?: string;
  readyState?: number;
  src?: string;
  srcObject?: MediaStream | null;
  volume?: number;
}

export interface HTMLMenuElementProperties {
  compact?: boolean;
  type?: string;
}

export interface HTMLMetaElementProperties {
  charset?: string;
  content?: string;
  httpEquiv?: string;
  name?: string;
  scheme?: string;
  url?: string;
}

export interface HTMLMeterElementProperties {
  high?: number;
  low?: number;
  max?: number;
  min?: number;
  optimum?: number;
  value?: number;
}

export interface HTMLModElementProperties {
  cite?: string;
  dateTime?: string;
}

export interface HTMLOListElementProperteis {
  compact?: boolean;
  start?: number;
  type?: string;
}

export interface HTMLObjectElementProperties {
  align?: string;
  alt?: string;
  altHtml?: string;
  archive?: string;
  border?: string;
  code?: string;
  codeBase?: string;
  codeType?: string;
  data?: string;
  declare?: boolean;
  height?: string;
  hspace?: number;
  msPlayToDisabled?: boolean;
  msPlayToPreferredSourceUri?: string;
  msPlayToPrimary?: boolean;
  name?: string;
  standby?: string;
  type?: string;
  useMap?: string;
  vspace?: number;
  width?: string;
}

export interface HTMLOptGroupElementProperties {
  defaultSelected?: boolean;
  disabled?: boolean;
  label?: string;
  selected?: boolean;
  value?: string;
}

export interface HTMLOptionElementProperties {
  defaultSelected?: boolean;
  disabled?: boolean;
  label?: string;
  selected?: boolean;
  text?: string;
  value?: string;
}

export interface HTMLOutputElementProperties {
  defaultValue?: string;
  name?: string;
  value?: string;
}

export interface HTMLParagraphElementProperties {
  align?: string;
  clear?: string;
}

export interface HTMLParamElementProperties {
  name?: string;
  type?: string;
  value?: string;
  valueType?: string;
}

export interface HTMLPictureElementProperties { }

export interface HTMLPreElementProperties {
  width?: number;
}

export interface HTMLProgressElementProperties {
  max?: number;
  value?: number;
}

export interface HTMLQuoteElementProperties {
  cite?: string;
}

export interface HTMLScriptElementProperties {
  async?: boolean;
  charset?: string;
  crossOrigin?: string | null;
  defer?: boolean;
  event?: string;
  htmlFor?: string;
  src?: string;
  text?: string;
  type?: string;
  integrity?: string;
}

export interface HTMLSelectElementProperties {
  autofocus?: boolean;
  disabled?: boolean;
  length?: number;
  multiple?: boolean;
  name?: string;
  required?: boolean;
  selectedIndex?: number;
  selectedOptions?: HTMLCollectionOf<HTMLOptionElement>;
  size?: number;
  value?: string;
}

export interface HTMLSourceElementProperties {
  media?: string;
  msKeySystem?: string;
  sizes?: string;
  src?: string;
  srcset?: string;
  type?: string;
}

export interface HTMLSpanElementProperties { }

export interface HTMLStyleElementProperties {
  disabled?: boolean;
  media?: string;
  type?: string;
}

export interface HTMLTableCaptionElementProperties {
  align?: string;
  vAlign?: string;
}

export interface HTMLTableCellElementProperties {
  abbr?: string;
  align?: string;
  axis?: string;
  bgColor?: any;
  colSpan?: number;
  headers?: string;
  height?: any;
  noWrap?: boolean;
  rowSpan?: number;
  scope?: string;
  width?: string;
}

export interface HTMLTableColElementProperties {
  align?: string;
  span?: number;
  width?: any;
}

export interface HTMLTableDataCellElementProperties
  { }

export interface HTMLTableElementProperties {
  align?: string;
  bgColor?: any;
  border?: string;
  borderColor?: any;
  caption?: HTMLTableCaptionElement;
  cellPadding?: string;
  cellSpacing?: string;
  cols?: number;
  frame?: string;
  height?: any;
  rows?: HTMLCollectionOf<HTMLTableRowElement>;
  rules?: string;
  summary?: string;
  tBodies?: HTMLCollectionOf<HTMLTableSectionElement>;
  tFoot?: HTMLTableSectionElement;
  tHead?: HTMLTableSectionElement;
  width?: string;
}

export interface HTMLTableHeaderCellElementProperties
 
{
  scope?: string;
}

export interface HTMLTableRowElementProperties {
  align?: string;
  bgColor?: any;
  cells?: HTMLCollectionOf<HTMLTableDataCellElement | HTMLTableHeaderCellElement>;
  height?: any;
}

export interface HTMLTableSectionElementProperties
 
{
  align?: string;
  rows?: HTMLCollectionOf<HTMLTableRowElement>;
}

export interface HTMLTemplateElementProperties { }

export interface HTMLTextAreaElementProperties {
  autofocus?: boolean;
  cols?: number;
  defaultValue?: string;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  name?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
  selectionEnd?: number;
  selectedStart?: number;
  status?: any;
  value?: string;
  wrap?: string;
}

export interface HTMLTimeElementProperties {
  dateTime?: string;
}

export interface HTMLTitleElementProperties {
  text?: string;
}

export interface HTMLTrackElementProperties {
  default?: boolean;
  kind?: string;
  label?: string;
  src?: string;
  srclang?: string;
}

export interface HTMLUListElementProperties {
  compact?: boolean;
  type?: string;
}

export interface HTMLUnknownElementProperties { }

export interface HTMLVideoElementProperties {
  height?: number;
  msHorizontalMirror?: boolean;
  msStereo3DPackingMode?: string;
  msStereo3DRenderMode?: string;
  msZoom?: boolean;
  poster?: string;
  width?: number;
}