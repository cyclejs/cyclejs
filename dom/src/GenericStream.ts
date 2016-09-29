// Just to give a name to the type, to express intent, we create GenericStream.
// We are supposed to use TypeScript Declaration Merging over a Sourceable
// to replace GenericStream with a specific stream type, e.g. Observable or
// Stream, depending on the stream library used.
export type GenericStream = any;
