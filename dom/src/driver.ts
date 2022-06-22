import { Driver } from '@cycle/run';
import {
  makeSubject,
  Producer,
  Operator,
  Dispose,
  pipe,
  subscribe,
  create,
  map,
  flatten,
  scan,
  filter,
} from '@cycle/callbags';
import {
  Module,
  toVNode,
  init,
  attributesModule,
  styleModule,
  classModule,
  propsModule,
  datasetModule,
  VNode,
} from 'snabbdom';

import { EventDelegator } from './eventDelegator';
import { DomEvent, DomCommand } from './types';
import { NamespaceTree } from './namespaceTree';
import { makeIsolateModule } from './isolateModule';

export const defaultModules: Module[] = [
  attributesModule,
  styleModule,
  classModule,
  propsModule,
  datasetModule,
];

export class DomDriver implements Driver<DomEvent, DomCommand> {
  private subject = makeSubject<DomEvent>();

  constructor(
    private container: string | Element | DocumentFragment,
    private modules: Module[] = defaultModules
  ) {
    if (typeof container !== 'string' && typeof container !== 'object') {
      throw new Error(
        'Given container is not a DOM element neither a selector string'
      );
    }
  }

  public provideSource(): Producer<DomEvent> {
    return this.subject;
  }

  public consumeSink(sink: Producer<DomCommand>): Dispose {
    const domReady$: Producer<null> = create((next, complete) => {
      if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', () => {
          const state = document.readyState;
          if (state === 'interactive' || state === 'complete') {
            next(null);
            complete();
          }
        });
      } else {
        next(null);
        complete();
      }
    });

    let ended = false;
    let patch: (oldVNode: VNode, newVNode: VNode) => VNode;
    const handleCommands: Operator<DomCommand, VNode> = sink => {
      const elem =
        typeof this.container === 'string'
          ? document.querySelector(this.container)
          : this.container;
      if (!elem) {
        throw new Error(
          `Cannot render into unknown element '${this.container}'`
        );
      }
      const vnode0 = toVNode(elem);
      vnode0.data ??= {};
      vnode0.data.namespace = [];

      let lastElem: Node | undefined = vnode0.elm;
      const rootElement$ = makeSubject<Node | DocumentFragment>();
      const namespaceTree = new NamespaceTree();
      namespaceTree.setRootElement(vnode0.elm as Element);

      const isolateModule = makeIsolateModule(
        namespaceTree,
        (receivers, elems) => {
          for (const n of receivers.keys()) {
            this.subject(1, { elements: elems, _cycleId: n });
          }
        },
        () => ended
      );
      patch = init(this.modules.concat(isolateModule));

      const delegator = new EventDelegator(
        namespaceTree,
        rootElement$,
        this.subject
      );
      rootElement$(1, vnode0.elm!);

      return pipe(
        sink,
        filter(command => {
          if (!command) {
            return false;
          }
          if ('commandType' in command) {
            switch (command.commandType) {
              case 'addEventListener':
                delegator.addEventListener(command);
                break;
              case 'removeEventListener':
                delegator.removeEventListener(command);
                break;
              case 'addElementsListener':
                isolateModule.insertElementListener(command);
                return true;
              case 'removeElementsListener':
                namespaceTree.removeElementListener(command);
                break;
            }
            return false;
          } else {
            return true;
          }
        }),
        sampleAnimationFrame,
        scan((vdom, command) => {
          if (ended) {
            return vdom;
          }
          if ('commandType' in command) {
            // Do not emit elements if only container exists
            if (vdom.children && vdom.children.length > 0) {
              // If no rendering is needed in the current frame, but a new element listener
              // was added, run the post method to send the initial elements to the listener
              isolateModule.post!();
            }
            return vdom;
          } else {
            const newVdom = patch(vdom, { ...vnode0, children: [command] });
            if (newVdom.elm !== lastElem) {
              lastElem = newVdom.elm;
              namespaceTree.setRootElement(newVdom.elm as Element);
              rootElement$(1, lastElem!);
            }
            return newVdom;
          }
        }, vnode0)
      );
    };

    let lastVdom: VNode;
    const dispose = pipe(
      domReady$,
      map(() => handleCommands(sink)),
      flatten,
      subscribe(
        vdom => {
          lastVdom = vdom;
        },
        undefined,
        () => {
          ended = true;
          patch(lastVdom, { ...lastVdom, children: [] });
        }
      )
    );
    return dispose;
  }
}

function sampleAnimationFrame(
  source: Producer<DomCommand>
): Producer<DomCommand> {
  return (_, sink) => {
    let inFlight = false;
    let hasSampled = false;
    let sampled: any;

    source(0, (t, d) => {
      if (t === 1) {
        if (!(hasSampled && 'commandType' in d)) {
          hasSampled = true;
          sampled = d;

          if (!inFlight) {
            inFlight = true;
            window.requestAnimationFrame(() => {
              hasSampled = false;
              inFlight = false;
              sink(1, sampled);
            });
          }
        }
      } else {
        sink(t, d);
      }
    });
  };
}
