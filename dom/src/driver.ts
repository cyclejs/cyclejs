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
  ) {}

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

    const handleCommands: Operator<DomCommand, null> = sink => {
      const elem =
        typeof this.container === 'string'
          ? document.querySelector(this.container)!
          : this.container;
      const vnode0 = toVNode(elem);

      let lastElem: Node | undefined = undefined;
      const rootElement$ = makeSubject<Node | DocumentFragment>();
      const namespaceTree = new NamespaceTree();
      debugger;
      namespaceTree.setRootElement(vnode0.elm as Element);

      const isolateModule = makeIsolateModule(
        namespaceTree,
        (receivers, elems) => {
          for (const n of receivers.keys()) {
            this.subject(1, { elements: elems, _cycleId: n });
          }
        }
      );
      const patch = init(this.modules.concat(isolateModule));

      const delegator = new EventDelegator(
        namespaceTree,
        rootElement$,
        this.subject
      );

      return pipe(
        sink,
        scan((vdom, command) => {
          if (!vdom.data) {
            vdom.data = {};
          }
          vdom.data.namespace = [];

          if (vdom.elm !== lastElem) {
            lastElem = vdom.elm!;
            namespaceTree.setRootElement(vdom.elm as Element);
            rootElement$(1, lastElem);
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
                const elems = namespaceTree.insertElementListener(command);
                if (elems) {
                  this.subject(1, {
                    elements: [...elems.keys()],
                    _cycleId: command.id,
                  });
                }
                break;
              case 'removeElementsListener':
                namespaceTree.removeElementListener(command);
                break;
            }
            return vdom;
          } else {
            return patch(vdom, { ...vnode0, children: [command] });
          }
        }, vnode0)
      );
    };

    const dispose = pipe(
      domReady$,
      map(() => handleCommands(sink)),
      flatten,
      subscribe(() => {})
    );
    return dispose;
  }
}
