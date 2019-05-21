import * as assert from 'assert';
import xs, { Stream, MemoryStream } from 'xstream';
import delay from 'xstream/extra/delay';
import concat from 'xstream/extra/concat';
import { setup } from '@cycle/run';
import {
  windowDriver,
  WindowSource,
} from '../../src/index';
import * as sinon from 'sinon'
import $ from 'jquery'
function createRenderTarget(id: string | null = null) {
  const element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}
function fakeWindow(){
  return {
    handler: null,
    document: {
      documentElement: {
        clientWidth: 1, 
        clientHeight: 1
      }
    },
    on: function (event, handler) {
      this.handler = handler;
    },
    fireResizeEvent: function () {
      this.handler();
    },
  }
} 


describe('WindowSource.events()', function () {
  let sandbox;
  beforeEach(function () {
    // create sandbox environment for mocking about
    sandbox = sinon.sandbox.create();
  });
  afterEach(function () {
    // restore the environment as it was before
    sandbox.restore();
  });
  it("driver has events", function (done) {
    const a = windowDriver()
    const windows = fakeWindow() 

    const ele = createRenderTarget()
    assert(a)
    assert(a.events)
    a.events("click").subscribe({
      next(ev) {
        assert.strictEqual(ev.type, 'click')
        done()
      }
    })
    ele.click()
  })

  it('should catch a basic click interaction Observable', function (done) {
    function app(_sources: { window: WindowSource }) {
      return {
      };
    }
    const ele = createRenderTarget()

    const { sinks, sources, run } = setup(app, {    
      window: windowDriver,
    }); 
    let dispose: any 
   
    sources.window.events("click").addListener({ 
      next: (ev: Event) => {
        assert.strictEqual(ev.type, 'click')
      }
    })
    ele.click() 
    dispose = run();
    dispose()
    done()
  });

  it('should setup click detection with events() after run() occurs', function (done) {
    function app(_sources: { window: WindowSource }) {
      return {
      };
    }
    const ele = createRenderTarget()

    const { sinks, sources, run } = setup(app, {
      window: windowDriver,
    });
    const dispose = run();

    sources.window.events("click").addListener({
      next: (ev: Event) => {
        assert.strictEqual(ev.type, 'click')
        dispose()
        done()
      }
    })
    ele.click()
  });

  it('should have the DevTools flag in the source stream', function (done) {
    function app(_sources: { window: WindowSource }) {
      return {
      };
    }
    const ele = createRenderTarget()

    const { sinks, sources, run } = setup(app, {
      window: windowDriver
    });
    const event$ = sources.window.select('.cycleTest').events('click');
    assert.strictEqual((event$)._isCycleSource, 'Window');
    done();
  });

});
