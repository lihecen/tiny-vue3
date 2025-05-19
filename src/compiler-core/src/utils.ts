import { NodeTypes } from "./ast";
export function isText(node) {
  if (node) {
    return (
      node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION
    );
  }
}
