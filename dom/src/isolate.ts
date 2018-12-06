import {Stream} from 'xstream';
import {VNode} from 'snabbdom/vnode';
import {isClassOrId} from './utils';
import {MainDOMSource} from './MainDOMSource';

export interface Scope {
  type: 'sibling' | 'total' | 'selector';
  scope: string; //Could be anything serializable
}

export type IsolateSink<T extends VNode> = (
  s: Stream<T>,
  scope: string
) => Stream<T>;

export function makeIsolateSink<T extends VNode>(
  namespace: Array<Scope>
): IsolateSink<T> {
  return (sink, scope) => {
    if (scope === ':root') {
      return sink;
    }

    return sink.map(node => {
      if (!node) {
        return node;
      }
      const scopeObj = getScopeObj(scope);
      const newNode = {
        ...(node as any),
        data: {
          ...node.data,
          isolate:
            !node.data || !Array.isArray(node.data.isolate)
              ? namespace.concat([scopeObj])
              : node.data.isolate,
        },
      };
      return {
        ...newNode,
        key:
          newNode.key !== undefined
            ? newNode.key
            : JSON.stringify(newNode.data.isolate),
      } as T;
    });
  };
}

export function getScopeObj(scope: string): Scope {
  return {
    type: isClassOrId(scope) ? 'sibling' : 'total',
    scope,
  };
}
