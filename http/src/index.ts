/**
 * HTTP Driver factory.
 *
 * This is a function which, when called, returns a HTTP Driver for Cycle.js
 * apps. The driver is also a function, and it takes a stream of requests as
 * input, and outputs an HTTP Source, an object with some functions to query for
 * response streams.
 *
 * **Requests**. The stream of requests should emit either strings or objects.
 * If the stream emits strings, those should be the URL of the remote resource
 * over HTTP. If the stream emits objects, these should be instructions how
 * superagent should execute the request. These objects follow a structure
 * similar to superagent's request API itself. `request` object properties:
 *
 * - `url` *(String)*: the remote resource path. **required**
 * - `method` *(String)*: HTTP Method for the request (GET, POST, PUT, etc).
 * - `category` *(String)*: an optional and arbitrary key that may be used in
 * the HTTP Source when querying for the response. E.g.
 * `sources.http.select(category)`
 * - `query` *(Object)*: an object with the payload for `GET` or `POST`.
 * - `send` *(Object)*: an object with the payload for `POST`.
 * - `headers` *(Object)*: object specifying HTTP headers.
 * - `accept` *(String)*: the Accept header.
 * - `type` *(String)*: a short-hand for setting Content-Type.
 * - `user` *(String)*: username for authentication.
 * - `password` *(String)*: password for authentication.
 * - `field` *(Object)*: object where key/values are Form fields.
 * - `progress` *(Boolean)*: whether or not to detect and emit progress events
 * on the response Observable.
 * - `attach` *(Array)*: array of objects, where each object specifies `name`,
 * `path`, and `filename` of a resource to upload.
 * - `withCredentials` *(Boolean)*: enables the ability to send cookies from the
 * origin.
 * - `redirects` *(Number)*: number of redirects to follow.
 *
 * **Responses**. A metastream is a stream that emits streams. The HTTP Source
 * manages response metastreams. These streams of responses have a `request`
 * field attached to them (to the stream object itself) indicating which request
 * (from the driver input) generated this response streams. The HTTP Source has
 * functions `filter()`, `select()`, and `response$$`, but is not itself a
 * stream. So you can call
 * `sources.HTTP.filter(response$ => response$.request.url === X)` to get a new
 * HTTP Source object which is filtered for response streams that match the
 * condition given, and may call `sources.HTTP.select(category)` to get a
 * metastream of response that match the category key. With an HTTP Source, you
 * can also use `httpSource.response$$` to get the metastream. You should
 * flatten the metastream before consuming it, then the resulting response
 * stream will emit the response object received through superagent.
 *
 * @return {Function} the HTTP Driver function
 * @function makeHTTPDriver
 */
export {makeHTTPDriver} from './http-driver';
export {
  RequestOptions,
  Attachment,
  RequestInput,
  Response,
  ResponseStream,
  HTTPSource
} from './interfaces';
