export interface VNode {
  sel?: string;
  data?: any;
  children?: Array<VNode | string>;
  text?: string;
  key?: any;
  elm?: Element;
}