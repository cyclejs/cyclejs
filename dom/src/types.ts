import { VNode } from 'snabbdom';

export type DomEvent = Event & { _cycleId: number };

export type DomCommand =
  | VNode
  | AddEventListenerCommand
  | RemoveEventListenerCommand;

export type AddEventListenerCommand = {
  commandType: 'addEventListener';
  id: number;
  namespace: Namespace;
  type: string;
  selector: string;
  options?: Options;
};

export type RemoveEventListenerCommand = {
  commandType: 'removeEventListener';
  id: number;
};

export type Options = {
  capture?: boolean;
  bubbles?: boolean;
};

export type ScopeType = 'sibling' | 'total';
export type ScopeValue = string | symbol | number;

export type Scope = { type: ScopeType; value: ScopeValue };
export type Namespace = Scope[];
