declare module 'superagent-mock' {
  import {SuperAgentStatic} from 'superagent';

  type methodHandler = (match: RegExpExecArray, fixtures: any) => any;

  namespace mockSuperagent {
    export type MockConfig = {
      pattern: string;
      fixtures(
        match: RegExpExecArray,
        data: any,
        headers: any,
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
    request: SuperAgentStatic,
    config: Array<mockSuperagent.MockConfig>,
    logger?: Function
  ): {unset: DisposeFunction};

  export = mockSuperagent;
}
