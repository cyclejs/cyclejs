import {
  Producer,
  Subject,
  pipe,
  filter,
  uponStart,
  uponEnd,
  map,
} from '@cycle/callbags';
import { IdGenerator, IsolateableApi } from '@cycle/run';

import { Namespace, DomEvent, DomCommand, Options, Scope } from './types';

export function makeDomApi(
  source: Producer<DomEvent>,
  subject: Subject<DomCommand>,
  gen: IdGenerator
): DomApi {
  return new DomApi(source, subject, gen);
}

export class DomApi implements IsolateableApi<DomEvent, DomCommand> {
  constructor(
    public readonly source: Producer<DomEvent>,
    private subject: Subject<DomCommand>,
    private idGenerator: IdGenerator,
    private namespace: Namespace = [],
    private selector: string = ''
  ) {}

  public isolateSource(scope: string | Scope): DomApi {
    const s: Scope =
      typeof scope === 'string' ? { type: 'total', value: scope } : scope;
    return new DomApi(
      this.source,
      this.subject,
      this.idGenerator,
      this.namespace.concat(s)
    );
  }

  public isolateSink(
    sink: Producer<DomCommand>,
    scope: string | Scope
  ): Producer<DomCommand> {
    const s: Scope =
      typeof scope === 'string' ? { type: 'total', value: scope } : scope;
    return pipe(
      sink,
      map(vdom => {
        if (!('commandType' in vdom)) {
          vdom.data ??= {};
          vdom.data.namespace = this.namespace.concat(s);
          if (typeof vdom.data.fn === 'function') {
            const fn = vdom.data.fn;
            vdom.data.fn = () => {
              const vnode = fn();
              vnode.data ??= {};
              vnode.data.namespace = vdom.data!.namespace;
              return vnode;
            };
          }
        }
        return vdom;
      })
    );
  }

  public create(
    source: Producer<DomEvent>,
    sinkSubject: Subject<DomCommand>,
    gen: IdGenerator
  ): DomApi {
    return new DomApi(source, sinkSubject, gen, this.namespace);
  }

  public select(selector: string): DomApi {
    return new DomApi(
      this.source,
      this.subject,
      this.idGenerator,
      this.namespace,
      this.selector === '' ? selector : this.selector + ' ' + selector
    );
  }

  public events(type: string, options?: Options): Producer<Event> {
    const id = this.idGenerator();
    return pipe(
      this.source,
      filter(ev => ev._cycleId === id),
      uponStart(() =>
        this.subject(1, {
          commandType: 'addEventListener',
          namespace: this.namespace,
          id,
          type,
          options,
          selector: this.selector,
        })
      ),
      uponEnd(() =>
        this.subject(1, {
          commandType: 'removeEventListener',
          id,
        })
      )
    );
  }

  public elements(): Producer<Element[]> {
    const id = this.idGenerator();
    return pipe(
      this.source,
      filter(ev => ev._cycleId === id),
      map(ev => (ev as any).elements),
      uponStart(() =>
        this.subject(1, {
          commandType: 'addElementsListener',
          id,
          namespace: this.namespace,
          selector: this.selector,
        })
      ),
      uponEnd(() =>
        this.subject(1, {
          commandType: 'removeElementsListener',
          id,
        })
      )
    );
  }

  public element(): Producer<Element> {
    return pipe(
      this.elements(),
      map(arr => arr[0])
    );
  }
}
