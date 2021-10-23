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

import { Namespace, DomEvent, DomCommand, Options } from './types';

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

  public isolateSource(scope: any): IsolateableApi<any, any> {
    return new DomApi(
      this.source,
      this.subject,
      this.idGenerator,
      this.namespace.concat(scope)
    );
  }

  public isolateSink(sink: Producer<DomCommand>, scope: any): Producer<any> {
    return pipe(
      sink,
      map(vdom => {
        if (!('commandType' in vdom)) {
          if (!vdom.data) {
            vdom.data = {};
          }
          vdom.data.namespace = this.namespace.concat(scope);
        }
        return vdom;
      })
    );
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
          commandType: 'attachEventListener',
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
}
