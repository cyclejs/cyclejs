/// <reference path="rx.all.d.ts"/>
/// <reference path="virtual-dom.d.ts"/>

interface Cycle {
  render(
    vtree$: Rx.IObservable<VDOM.VNode>,
    selector: string,
    customElementsRegistry?: CustomElementsRegistry): ReactiveNode;

  createStream<T>(definitionFn: (...sources: any[]) => T): InjectableSubject<T>;

  CustomElementsRegistry: CustomElementsRegistryStatic;

  vdomPropHook(fn: (element?: HTMLElement, prop?: any) => void): PropertyHook;

  Rx: any;

  h: any;
}

interface ReactiveNode {
  choose: Interaction;
  connect(onError?: (err: Error) => void): Rx.IDisposable;
}

interface Interaction {
  choose<T>(selector: string, eventName: string): Rx.IObservable<T>;
}

interface InjectableSubject<T> extends Rx.ReplaySubject<T> {
  inject(...injections: any[]): any;
}

interface CustomElementsRegistry {
  registerCustomElement(tagName: string, definitionFn: CustomElementDefinitionFunc): void;
}

interface CustomElementsRegistryStatic {
  new (): CustomElementsRegistry;
}

interface CustomElementDefinitionFunc {
  (props$?: Rx.IObservable<any>, interaction$?: Interaction): CustomElementDefinition;
}

interface CustomElementDefinition {
  vtree$: Rx.IObservable<VDOM.VNode>;
  events: Array<[string, Rx.IObservable<any>]>;
}

interface PropertyHook {
  hook(): void;
}

declare module "cyclejs" {
  export = Cycle;
}
declare var Cycle: Cycle;
