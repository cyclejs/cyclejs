import {Stream, MemoryStream} from 'xstream';

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
  send?: Object;
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
  _error?: any;
  _namespace?: Array<string>;
}

export type RequestInput = RequestOptions | string;

export interface ResponseStream {
  request: RequestOptions;
}

export interface Response {
  text?: string;
  body?: Object;
  header?: Object;
  type?: string;
  status?: number;
  total?: number;
  request: RequestOptions;
}

export interface HTTPSource {
  filter<S extends HTTPSource>(predicate: (request: RequestOptions) => boolean): S;
  select(category?: string): Stream<MemoryStream<Response> & ResponseStream>;
  isolateSource: (source: HTTPSource, scope: string) => HTTPSource;
  isolateSink: (sink: Stream<RequestInput>, scope: string) => Stream<RequestInput>;
}
