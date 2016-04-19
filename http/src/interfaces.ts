export interface Attachment {
  name: string;
  path?: string;
  filename?: string;
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
  withCredentials?: boolean;
  redirects?: number;
  category?: string;
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
  request?: RequestOptions;
}
