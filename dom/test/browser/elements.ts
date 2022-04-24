import * as assert from 'assert';
import { of, pipe, take, subscribe, drop } from '@cycle/callbags';
import { setup } from '@cycle/run';
import { div, span, p, makeDomPlugin, DomApi } from '../../src/index';

import { createRenderTarget } from './helpers';

describe('DOMSource.elements()', function () {
  it('should return a stream of documents when querying "document"', done => {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    function isDocument(element: any): element is Document {
      return 'body' in element && 'head' in element;
    }

    let dispose: any;
    pipe(
      sources.DOM.select('document').element(),
      take(1),
      subscribe(root => {
        assert(root.body !== undefined); //Check type inference
        assert(isDocument(root));
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should return a stream of bodies when querying "body"', done => {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    function isBody(element: any): element is HTMLBodyElement {
      return 'aLink' in element && 'link' in element;
    }

    let dispose: any;
    pipe(
      sources.DOM.select('body').element(),
      take(1),
      subscribe(root => {
        assert(root.aLink !== undefined); //Check type inference
        assert(isBody(root));
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should return a stream of arrays of elements of size 1 when querying ":root"', done => {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    pipe(
      sources.DOM.elements(),
      drop(1),
      take(1),
      subscribe(root => {
        assert(root.forEach !== undefined); //Check type inference
        assert(Array.isArray(root));
        assert(root.length === 1);
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should return a stream of arrays of elements of size 2 when querying ".some"', done => {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(div('.top-most', [div('.some'), div('.some')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    pipe(
      sources.DOM.select('.some').elements(),
      drop(1),
      take(1),
      subscribe(elems => {
        assert(Array.isArray(elems));
        assert(elems.length === 2);
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });
});
