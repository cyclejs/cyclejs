import {Stream, MemoryStream} from 'xstream';
import {Response as SuperagentResponse} from 'superagent';

export interface Attachment {
  name: string;
  path?: string;
  filename?: string;
}

export interface AgentOptions {
  key: string;
  cert: string;
}

export interface RequestOptions {
  url: string;
  method?: string;
  query?: Object;
  send?: Object | string;
  headers?: Object;
  accept?: string;
  type?: string;
  user?: string;
  password?: string;
  field?: Object;
  progress?: boolean;
  attach?: Array<Attachment>;
  agent?: AgentOptions;
  withCredentials?: boolean;
  redirects?: number;
  category?: string;
  lazy?: boolean;
  responseType?: string;
  ok?: ((res: SuperagentResponse) => boolean);
  _error?: any;
  _namespace?: Array<string>;
}

export type RequestInput = RequestOptions | string;

export interface ResponseStream {
  request: RequestOptions;
}

export interface Response extends SuperagentResponse {
  total?: number; // Not sure what is this. Stays here to avoid breaking change
  request: RequestOptions;
}

export interface HTTPSource {
  filter(
    predicate: (request: RequestOptions) => boolean,
    scope?: string
  ): HTTPSource;
  select(category?: string): Stream<MemoryStream<Response> & ResponseStream>;
  isolateSource(source: HTTPSource, scope: string): HTTPSource;
  isolateSink(sink: Stream<RequestInput>, scope: string): Stream<RequestInput>;
}
