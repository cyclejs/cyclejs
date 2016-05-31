export interface ParsedSelector {
  tagName: string;
  id: string;
  className: string;
}
export default function selectorParser(selector: string): ParsedSelector;
