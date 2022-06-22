import { ID } from '@cycle/run';
import { VNode } from 'snabbdom';

export type DomEvent = PatchedEvent | { elements: Element[]; _cycleId: ID };

export type PatchedEvent = Event & {
  _cycleId: ID;
  propagationStopped: boolean;
};

export type DomCommand =
  | VNode
  | AddEventListenerCommand
  | RemoveEventListenerCommand
  | AddElementsListenerCommand
  | RemoveElementsListenerCommand;

export type AddElementsListenerCommand = {
  commandType: 'addElementsListener';
  id: ID;
  namespace: Namespace;
  selector: string;
};

export type RemoveElementsListenerCommand = {
  commandType: 'removeElementsListener';
  id: ID;
};

export type AddEventListenerCommand = {
  commandType: 'addEventListener';
  id: ID;
  namespace: Namespace;
  type: string;
  selector: string;
  options?: Options;
};

export type RemoveEventListenerCommand = {
  commandType: 'removeEventListener';
  id: ID;
};

export type Options = {
  capture?: boolean;
  bubbles?: boolean;
};

export type ScopeType = 'sibling' | 'total';
export type ScopeValue = string | symbol | number;

export type Scope = { type: ScopeType; value: ScopeValue };
export type Namespace = Scope[];
