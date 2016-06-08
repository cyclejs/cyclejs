export interface EventsFnOptions {
  useCapture?: boolean;
}

// Just to give a name to the type, to express intent, we create GenericStream.
// We are supposed to use TypeScript Declaration Merging over the DOMSource
// to replace GenericStream with a specific stream type, e.g. Observable or
// Stream, depending on the stream library used.
export type GenericStream = any;

export interface DOMSource {
  select(selector: string): DOMSource;
  elements(): GenericStream;
  events(eventType: string, options?: EventsFnOptions): GenericStream;
}
