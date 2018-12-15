// TODO: upload it to definitely-typed later ?

declare module 'superagent-mock' {
  import {SuperAgentStatic} from 'superagent';

  type methodHandler = (match: RegExpExecArray, fixtures: any) => any;

  // namespace trick to still export Type from a commonjs module
  namespace mockSuperagent {
    export type MockConfig = {
      pattern: string;
      fixtures(
        match: RegExpExecArray,
        data: any,
        header: any,
        context: any
      ): any;
      callback?: methodHandler;
      get?: methodHandler;
      head?: methodHandler;
      options?: methodHandler;
      del?: methodHandler;
      delete?: methodHandler;
      patch?: methodHandler;
      post?: methodHandler;
      put?: methodHandler;
    };
  }

  type DisposeFunction = () => void;

  function mockSuperagent(
    Request: SuperAgentStatic,
    config: Array<mockSuperagent.MockConfig>,
    logger?: Function
  ): {unset: DisposeFunction};

  // It's a commonjs module
  export = mockSuperagent;
}
