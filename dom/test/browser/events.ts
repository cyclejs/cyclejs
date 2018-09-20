import {isIE10} from './setup';
import * as assert from 'assert';
import isolate from '@cycle/isolate';
import xs, {Stream, MemoryStream} from 'xstream';
import delay from 'xstream/extra/delay';
import concat from 'xstream/extra/concat';
import {setup} from '@cycle/run';
import {
  div,
  input,
  span,
  h2,
  h3,
  h4,
  form,
  button,
  makeDOMDriver,
  DOMSource,
  MainDOMSource,
} from '../../src/index';

function createRenderTarget(id: string | null = null) {
  const element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

function testFragmentEvents() {
  let captures = false;
  let bubbles = false;
  const captureEvent = document.createEvent('CustomEvent');
  const bubbleEvent = document.createEvent('CustomEvent');
  const fragment = document.createDocumentFragment();
  const parent = document.createElement('div');
  const child = document.createElement('div');
  fragment.appendChild(parent);
  parent.appendChild(child);
  parent.addEventListener(
    'fragmentCapture',
    () => {
      captures = true;
    },
    true
  );
  parent.addEventListener(
    'fragmentBubble',
    () => {
      bubbles = true;
    },
    false
  );
  captureEvent.initCustomEvent('fragmentCapture', false, true, null);
  bubbleEvent.initCustomEvent('fragmentBubble', true, true, null);
  child.dispatchEvent(captureEvent);
  child.dispatchEvent(bubbleEvent);
  return {captures, bubbles};
}

const fragmentSupport = testFragmentEvents();

describe('DOMSource.events()', function() {
  it('should catch a basic click interaction Observable', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    let dispose: any;
    sources.DOM.select('.myelementclass')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Foobar');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: function(root: Element) {
          const myElement = root.querySelector(
            '.myelementclass'
          ) as HTMLElement;
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function() {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should setup click detection with events() after run() occurs', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(h3('.test2.myelementclass', 'Foobar')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    const dispose = run();
    sources.DOM.select('.myelementclass')
      .events('click')
      .addListener({
        next(ev: Event) {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Foobar');
          dispose();
          done();
        },
      });

    setTimeout(() => {
      const myElement = document.querySelector(
        '.test2.myelementclass'
      ) as HTMLElement;
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function() {
        setTimeout(() => myElement.click());
      });
    }, 200);
  });

  it('should setup click detection on a ready DOM element (e.g. from server)', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.never(),
      };
    }

    const containerElement = createRenderTarget();
    const headerElement = document.createElement('H3');
    headerElement.className = 'myelementclass';
    headerElement.textContent = 'Foobar';
    containerElement.appendChild(headerElement);

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(containerElement),
    });
    const dispose = run();
    sources.DOM.select('.myelementclass')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Foobar');
          dispose();
          done();
        },
      });

    setTimeout(() => {
      const myElement = containerElement.querySelector(
        '.myelementclass'
      ) as HTMLElement;
      assert.notStrictEqual(myElement, null);
      assert.notStrictEqual(typeof myElement, 'undefined');
      assert.strictEqual(myElement.tagName, 'H3');
      assert.doesNotThrow(function() {
        setTimeout(() => myElement.click());
      });
    }, 200);
  });

  it('should catch events using id of root element in DOM.select', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-001')),
    });

    let dispose: any;
    sources.DOM.select('#parent-001')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Foobar');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const myElement = root.querySelector(
            '.myelementclass'
          ) as HTMLElement;
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function() {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch events using id of top element in DOM.select', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(h3('#myElementId', 'Foobar')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-002')),
    });

    let dispose: any;
    sources.DOM.select('#myElementId')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Foobar');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const myElement = root.querySelector('#myElementId') as HTMLElement;
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function() {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch interaction events without prior select()', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [h3('.myelementclass', 'Foobar')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.events('click').addListener({
      next: (ev: Event) => {
        assert.strictEqual(ev.type, 'click');
        assert.strictEqual((ev.target as HTMLElement).textContent, 'Foobar');
        dispose();
        done();
      },
    });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const myElement = root.querySelector(
            '.myelementclass'
          ) as HTMLElement;
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H3');
          assert.doesNotThrow(function() {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch user events using DOM.select().select().events()', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.foo', [h4('.bar', 'Correct')]),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select('.foo')
      .select('.bar')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Correct');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const wrongElement = root.querySelector('.bar') as HTMLElement;
          const correctElement = root.querySelector('.foo .bar') as HTMLElement;
          assert.notStrictEqual(wrongElement, null);
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof wrongElement, 'undefined');
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(wrongElement.tagName, 'H2');
          assert.strictEqual(correctElement.tagName, 'H4');
          assert.doesNotThrow(function() {
            setTimeout(() => wrongElement.click());
            setTimeout(() => correctElement.click(), 15);
          });
        },
      });
    dispose = run();
  });

  it('should catch events from many elements using DOM.select().events()', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          div('.parent', [
            h4('.clickable.first', 'First'),
            h4('.clickable.second', 'Second'),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select('.clickable')
      .events('click')
      .take(1)
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'First');
        },
      });

    sources.DOM.select('.clickable')
      .events('click')
      .drop(1)
      .take(1)
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Second');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const firstElem = root.querySelector('.first') as HTMLElement;
          const secondElem = root.querySelector('.second') as HTMLElement;
          assert.notStrictEqual(firstElem, null);
          assert.notStrictEqual(typeof firstElem, 'undefined');
          assert.notStrictEqual(secondElem, null);
          assert.notStrictEqual(typeof secondElem, 'undefined');
          assert.doesNotThrow(function() {
            setTimeout(() => firstElem.click());
            setTimeout(() => secondElem.click(), 5);
          });
        },
      });
    dispose = run();
  });

  it('should catch interaction events from future elements', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: concat(
          xs.of(h2('.blesh', 'Blesh')),
          xs.of(h3('.blish', 'Blish')).compose(delay(150)),
          xs.of(h4('.blosh', 'Blosh')).compose(delay(150))
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget('parent-002')),
    });

    let dispose: any;
    sources.DOM.select('.blosh')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          assert.strictEqual((ev.target as HTMLElement).textContent, 'Blosh');
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(3)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const myElement = root.querySelector('.blosh') as HTMLElement;
          assert.notStrictEqual(myElement, null);
          assert.notStrictEqual(typeof myElement, 'undefined');
          assert.strictEqual(myElement.tagName, 'H4');
          assert.strictEqual(myElement.textContent, 'Blosh');
          assert.doesNotThrow(function() {
            setTimeout(() => myElement.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch bubbling events in a DocumentFragment', function(done) {
    if (isIE10) {
      done();
      return;
    }

    const {bubbles: thisBrowserBubblesFragmentEvents} = fragmentSupport;

    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div([div('.clickable', 'Hello')])),
      };
    }

    if (!thisBrowserBubblesFragmentEvents) {
      done();
    } else {
      const fragment = document.createDocumentFragment();
      const renderTarget = fragment.appendChild(document.createElement('div'));

      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(renderTarget as Element),
      });

      sources.DOM.select('.clickable')
        .events('click', {useCapture: false})
        .addListener({
          next: (ev: Event) => {
            const elem = ev.target as HTMLElement;
            assert.strictEqual(ev.type, 'click');
            assert.strictEqual(elem.tagName, 'DIV');
            assert.strictEqual(elem.className, 'clickable');
            assert.strictEqual(elem.textContent, 'Hello');
            const top = elem.parentElement as Node;
            const renderTarget2 = top.parentNode as Node;
            const frag = renderTarget2.parentNode as Node;
            assert.strictEqual(frag instanceof DocumentFragment, true);
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const clickable = root.querySelector('.clickable') as HTMLElement;
            setTimeout(() => clickable.click(), 80);
          },
        });
      run();
    }
  });

  it('should catch non-bubbling events in a DocumentFragment with useCapture', function(done) {
    if (isIE10) {
      done();
      return;
    }

    const {captures: thisBrowserCapturesFragmentEvents} = fragmentSupport;

    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div([div('.clickable', 'Hello')])),
      };
    }

    if (!thisBrowserCapturesFragmentEvents) {
      done();
    } else {
      const fragment = document.createDocumentFragment();
      const renderTarget = fragment.appendChild(document.createElement('div'));

      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(renderTarget as Element),
      });

      sources.DOM.select('.clickable')
        .events('click', {useCapture: true})
        .addListener({
          next: (ev: Event) => {
            const elem = ev.target as HTMLElement;
            assert.strictEqual(ev.type, 'click');
            assert.strictEqual(elem.tagName, 'DIV');
            assert.strictEqual(elem.className, 'clickable');
            assert.strictEqual(elem.textContent, 'Hello');
            const top = elem.parentElement as Node;
            const renderTarget2 = top.parentNode as Node;
            const frag = renderTarget2.parentNode as Node;
            assert.strictEqual(frag instanceof DocumentFragment, true);
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const clickable = root.querySelector('.clickable') as HTMLElement;
            setTimeout(() => clickable.click(), 80);
          },
        });
      run();
    }
  });

  it('should have currentTarget or ownerTarget pointed to the selected parent', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          div('.top', [h2('.parent', [span('.child', 'Hello world')])])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select('.parent')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'SPAN');
          assert.strictEqual(target.className, 'child');
          assert.strictEqual(target.textContent, 'Hello world');
          const currentTarget = ev.currentTarget as HTMLElement;
          const ownerTarget = (ev as any).ownerTarget as HTMLElement;
          const currentTargetIsParentH2 =
            currentTarget.tagName === 'H2' &&
            currentTarget.className === 'parent';
          const ownerTargetIsParentH2 =
            ownerTarget.tagName === 'H2' && ownerTarget.className === 'parent';
          assert.strictEqual(
            currentTargetIsParentH2 || ownerTargetIsParentH2,
            true
          );
          dispose();
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const child = root.querySelector('.child') as HTMLElement;
          assert.notStrictEqual(child, null);
          assert.notStrictEqual(typeof child, 'undefined');
          assert.strictEqual(child.tagName, 'SPAN');
          assert.strictEqual(child.className, 'child');
          assert.doesNotThrow(function() {
            setTimeout(() => child.click());
          });
        },
      });
    dispose = run();
  });

  it('should catch a non-bubbling Form `reset` event', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          div('.parent', [form('.form', [input('.field', {type: 'text'})])])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.form')
      .events('reset', {}, false)
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'reset');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'FORM');
          assert.strictEqual(target.className, 'form');
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _form = root.querySelector('.form') as HTMLFormElement;
          setTimeout(() => _form.reset());
        },
      });
    run();
  });

  it('should catch a non-bubbling click event with useCapture', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [div('.clickable', 'Hello')])),
      };
    }

    function click(el: Element): void {
      const ev = document.createEvent(`MouseEvent`);
      ev.initMouseEvent(
        `click`,
        false, // bubble
        true, // cancelable
        window,
        0,
        0,
        0,
        0,
        0, // coordinates
        false,
        false,
        false,
        false, // modifier keys
        0, //left
        null
      );
      el.dispatchEvent(ev);
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.clickable')
      .events('click', {useCapture: true}, false)
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'DIV');
          assert.strictEqual(target.className, 'clickable');
          assert.strictEqual(target.textContent, 'Hello');
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const clickable = root.querySelector('.clickable') as HTMLElement;
          setTimeout(() => click(clickable));
        },
      });
    run();
  });

  it('should catch a blur event with useCapture', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          div('.parent', [
            input('.correct', {type: 'text'}, []),
            input('.wrong', {type: 'text'}, []),
            input('.dummy', {type: 'text'}),
          ])
        ),
      };
    }

    if (!document.hasFocus()) {
      done();
    } else {
      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.select('.correct')
        .events('blur', {useCapture: true})
        .addListener({
          next: (ev: Event) => {
            assert.strictEqual(ev.type, 'blur');
            assert.strictEqual((ev.target as HTMLElement).className, 'correct');
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const correct = root.querySelector('.correct') as HTMLElement;
            const wrong = root.querySelector('.wrong') as HTMLElement;
            const dummy = root.querySelector('.dummy') as HTMLElement;
            setTimeout(() => wrong.focus(), 50);
            setTimeout(() => dummy.focus(), 100);
            setTimeout(() => correct.focus(), 150);
            setTimeout(() => dummy.focus(), 200);
          },
        });
      run();
    }
  });

  it('should catch a blur event by default (no options)', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          div('.parent', [
            input('.correct', {type: 'text'}, []),
            input('.wrong', {type: 'text'}, []),
            input('.dummy', {type: 'text'}),
          ])
        ),
      };
    }

    if (!document.hasFocus()) {
      done();
    } else {
      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.select('.correct')
        .events('blur')
        .addListener({
          next: (ev: Event) => {
            assert.strictEqual(ev.type, 'blur');
            assert.strictEqual((ev.target as HTMLElement).className, 'correct');
            done();
          },
        });

      sources.DOM.select(':root')
        .element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const correct = root.querySelector('.correct') as HTMLElement;
            const wrong = root.querySelector('.wrong') as HTMLElement;
            const dummy = root.querySelector('.dummy') as HTMLElement;
            setTimeout(() => wrong.focus(), 50);
            setTimeout(() => dummy.focus(), 100);
            setTimeout(() => correct.focus(), 150);
            setTimeout(() => dummy.focus(), 200);
          },
        });
      run();
    }
  });

  it('should not simulate bubbling for non-bubbling events', done => {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          div('.parent', [form('.form', [input('.field', {type: 'text'})])])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.parent')
      .events('reset')
      .addListener({
        next: (ev: Event) => {
          done(new Error('Reset event should not bubble to parent'));
        },
      });

    sources.DOM.select('.form')
      .events('reset')
      .compose(delay(200))
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'reset');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'FORM');
          assert.strictEqual(target.className, 'form');
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _form = root.querySelector('.form') as HTMLFormElement;
          setTimeout(() => _form.reset());
        },
      });
    run();
  });

  it('should have the DevTools flag in the source stream', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    const event$ = sources.DOM.select('.myelementclass').events('click');
    assert.strictEqual((event$ as any)._isCycleSource, 'DOM');
    done();
  });

  it('should allow restarting of event streams from isolated components', function(done) {
    const outSubject = xs.create<any>();
    const switchSubject = xs.create<any>();

    function component(_sources: {DOM: DOMSource}) {
      const itemMouseDown$ = _sources.DOM.select('.item').events(
        'mousedown',
        {},
        false
      );
      const itemMouseUp$ = _sources.DOM.select('.item').events(
        'mouseup',
        {},
        false
      );

      const itemMouseClick$ = itemMouseDown$
        .map(down => itemMouseUp$.filter(up => down.target === up.target))
        .flatten();

      switchSubject
        .map(() => itemMouseClick$)
        .flatten()
        .addListener({
          next: (ev: any) => {
            outSubject.shamefullySendNext(ev);
          },
        });

      return {
        DOM: xs.of(button('.item', ['stuff'])),
      };
    }

    function app(_sources: {DOM: DOMSource}) {
      return isolate(component)(_sources);
    }

    function mouseevent(el: Element, type: string) {
      // This works on IE10
      const ev = document.createEvent('MouseEvent');
      ev.initMouseEvent(
        type,
        false, // bubble
        true, // cancelable
        window,
        0,
        0,
        0,
        0,
        0, // coordinates
        false,
        false,
        false,
        false, // modifier keys
        0, //left
        null
      );

      // Would rather user this line below but does not work on IE10
      //const ev = new MouseEvent(type)

      el.dispatchEvent(ev);
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let count = 0;
    outSubject.addListener({
      next: (ev: any) => {
        assert.strictEqual(ev.type, 'mouseup');
        count++;
        if (count === 2) {
          done();
        }
      },
    });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const clickable = root.querySelector('.item') as HTMLElement;
          setTimeout(() => switchSubject.shamefullySendNext(null));
          setTimeout(() => mouseevent(clickable, 'mousedown'), 100);
          setTimeout(() => mouseevent(clickable, 'mouseup'), 200);
          setTimeout(() => switchSubject.shamefullySendNext(null), 300);
          setTimeout(() => mouseevent(clickable, 'mousedown'), 400);
          setTimeout(() => mouseevent(clickable, 'mouseup'), 500);
        },
      });
    run();
  });

  it('should allow preventing default event behavior', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [button('.button')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {preventDefault: true})
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _button = root.querySelector('.button') as HTMLButtonElement;
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should allow preventing default event behavior with function', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [button('.button')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {preventDefault: (ev: any) => ev.type === 'click'})
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _button = root.querySelector('.button') as HTMLButtonElement;
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should allow preventing default event behavior with object', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [button('.button')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {preventDefault: {type: 'click'}})
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _button = root.querySelector('.button') as HTMLButtonElement;
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should allow preventing default event behavior with array in object', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [button('.button.to-prevent')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {
        preventDefault: {target: {classList: ['button', 'to-prevent']}},
      })
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button to-prevent');
          assert.strictEqual(ev.defaultPrevented, true);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _button = root.querySelector('.button') as HTMLButtonElement;
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should not prevent default on returning false from function predicate', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [button('.button')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {preventDefault: (ev: any) => ev.type !== 'click'})
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, false);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _button = root.querySelector('.button') as HTMLButtonElement;
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should not prevent default on returning false from object predicate', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [button('.button')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {preventDefault: {type: 'notClick'}})
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button');
          assert.strictEqual(ev.defaultPrevented, false);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _button = root.querySelector('.button') as HTMLButtonElement;
          setTimeout(() => _button.click());
        },
      });
    run();
  });

  it('should not prevent default on returning false from array-in-object predicate', function(done) {
    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(div('.parent', [button('.button.to-prevent')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.button')
      .events('click', {
        preventDefault: {target: {classList: ['button', 'missing-class']}},
      })
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(ev.type, 'click');
          const target = ev.target as HTMLElement;
          assert.strictEqual(target.tagName, 'BUTTON');
          assert.strictEqual(target.className, 'button to-prevent');
          assert.strictEqual(ev.defaultPrevented, false);
          done();
        },
      });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const _button = root.querySelector('.button') as HTMLButtonElement;
          setTimeout(() => _button.click());
        },
      });
    run();
  });
});
