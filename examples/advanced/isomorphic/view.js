import hModule from 'snabbdom/h.js';
import helpers from 'hyperscript-helpers';

// Use the HTML driver's VNode helpers without importing browser-only DOM modules.
const h = hModule.default || hModule;
export const {
  html,
  head,
  title,
  body,
  div,
  script,
  ul,
  li,
  a,
  section,
  h1,
  p,
} = helpers(h);
