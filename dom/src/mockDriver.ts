import { Driver, ID } from '@cycle/run';
import {
  makeSubject,
  pipe,
  subscribe,
  Producer,
  Dispose,
} from '@cycle/callbags';

import { DomCommand, DomEvent, Namespace, ScopeValue } from './types';
import { makeDomApi } from './api';

export const elementSymbol = Symbol('elements');

export type Data = Partial<
  Record<string | typeof elementSymbol, Producer<any> | undefined>
>;
export type Value<Scope> = Scope extends 'data'
  ? Data
  : Record<ScopeValue, EventSpec>;
export type EventSpec = {
  [scope in 'sibling' | 'total' | 'selector' | 'data']?: Value<scope>;
};

class MockDomDriver implements Driver<DomEvent, DomCommand> {
  private subject = makeSubject<DomEvent>();
  private subscriptions: Dispose[] = [];
  private ended = new Map<ID, boolean>();

  constructor(private eventSpec: EventSpec) {}

  public provideSource(): Producer<DomEvent> {
    return this.subject;
  }

  public consumeSink(sink: Producer<DomCommand>): Dispose {
    return pipe(
      sink,
      subscribe(cmd => {
        if ('commandType' in cmd) {
          if (
            cmd.commandType === 'addEventListener' ||
            cmd.commandType === 'addElementsListener'
          ) {
            const producer = this.traverseSpec(
              cmd.namespace.concat(
                cmd.selector
                  ? [{ type: 'selector', value: cmd.selector } as any]
                  : []
              )
            )?.[
              cmd.commandType === 'addEventListener' ? cmd.type : elementSymbol
            ];

            if (producer) {
              this.subscriptions.push(
                pipe(
                  producer,
                  subscribe(ev => {
                    if (!this.ended.get(cmd.id)) {
                      const data =
                        cmd.commandType === 'addEventListener'
                          ? Object.assign(ev, { _cycleId: cmd.id })
                          : { elements: ev, _cycleId: cmd.id };

                      queueMicrotask(() => this.subject(1, data));
                    }
                  })
                )
              );
            }
          } else {
            this.ended.set(cmd.id, true);
          }
        }
      })
    );
  }

  private traverseSpec(namespace: Namespace): Data | undefined {
    let curr: EventSpec | undefined = this.eventSpec;
    for (let i = 0; i < namespace.length; i++) {
      const n = namespace[i];
      curr = curr[n.type]?.[n.value];
      if (!curr) {
        return undefined;
      }
    }
    return curr.data;
  }
}

export function makeMockDomPlugin(
  eventSpec: EventSpec
): [MockDomDriver, typeof makeDomApi] {
  return [new MockDomDriver(eventSpec), makeDomApi];
}
