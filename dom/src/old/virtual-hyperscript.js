/* eslint-disable */
var isArray = require('x-is-array');

var VNode = require('virtual-dom/vnode/vnode.js');
var VText = require('virtual-dom/vnode/vtext.js');
var isVNode = require('virtual-dom/vnode/is-vnode');
var isVText = require('virtual-dom/vnode/is-vtext');
var isWidget = require('virtual-dom/vnode/is-widget');
var isHook = require('virtual-dom/vnode/is-vhook');
var isVThunk = require('virtual-dom/vnode/is-thunk');

var parseTag = require('virtual-dom/virtual-hyperscript/parse-tag.js');
var softSetHook = require('virtual-dom/virtual-hyperscript/hooks/soft-set-hook.js');
var evHook = require('virtual-dom/virtual-hyperscript/hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
  var childNodes = [];
  var tag, props, key, namespace;

  if (!children && isChildren(properties)) {
    children = properties;
    props = {};
  }

  props = props || properties || {};
  tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
      key = props.key;
      props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
      namespace = props.namespace;
      props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
      !namespace &&
      props.hasOwnProperty('value') &&
      props.value !== undefined &&
      !isHook(props.value)
      ) {
      props.value = softSetHook(props.value);
  }

  transformProperties(props);

  if (children !== undefined && children !== null) {
    addChild(children, childNodes, tag, props);
  }


  return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
  if (typeof c === 'string') {
    childNodes.push(new VText(c));
  } else if (typeof c === 'number') {
    childNodes.push(new VText(String(c)));
  } else if (isChild(c)) {
    childNodes.push(c);
  } else if (isArray(c)) {
    for (var i = 0; i < c.length; i++) {
      addChild(c[i], childNodes, tag, props);
    }
  } else if (c === null || c === undefined) {
    return;
  } else {
    throw UnexpectedVirtualElement({
      foreignObject: c,
      parentVnode: {
        tagName: tag,
        properties: props
      }
    });
  }
}

function transformProperties(props) {
  for (var propName in props) {
    if (props.hasOwnProperty(propName)) {
      var value = props[propName];

      if (isHook(value)) {
        continue;
      }

      if (propName.substr(0, 3) === 'ev-') {
        // add ev-foo support
        props[propName] = evHook(value);
      }
    }
  }
}

// START Cycle.js-specific code >>>>>>>>
function isObservable(x) {
  return x && typeof x.subscribe === 'function';
}

function isChild(x) {
  return isVNode(x) || isVText(x) || isObservable(x) || isWidget(x) || isVThunk(x);
}
// END Cycle.js-specific code <<<<<<<<<<

function isChildren(x) {
  return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
  var err = new Error();

  err.type = 'virtual-hyperscript.unexpected.virtual-element';
  err.message = 'Unexpected virtual child passed to h().\n' +
  'Expected a VNode / Vthunk / VWidget / string but:\n' +
  'got:\n' +
  errorString(data.foreignObject) +
  '.\n' +
  'The parent vnode is:\n' +
  errorString(data.parentVnode)
  '\n' +
  'Suggested fix: change your `h(..., [ ... ])` callsite.';
  err.foreignObject = data.foreignObject;
  err.parentVnode = data.parentVnode;

  return err;
}

function errorString(obj) {
  try {
    return JSON.stringify(obj, null, '    ');
  } catch (e) {
    return String(obj);
  }
}
/* eslint-enable */
