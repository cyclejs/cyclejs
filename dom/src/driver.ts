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

      let lastElem: Node | undefined = undefined;
      const rootElement$ = makeSubject<Node | DocumentFragment>();
      const namespaceTree = new NamespaceTree();
      const isolateModule = makeIsolateModule(namespaceTree, () => {}); // TODO: pass proper notify callback
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
            }
            return vdom;
          } else {
            return patch(vdom, command);
          }
        }, toVNode(elem))
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
