import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";
export function transform(root, options = {}) {
  //创建上下文对象
  const context = createTransformContext(root, options);
  //遍历 ast 抽象语法树
  //DFS深度优先遍历
  traverseNode(root, context);
  //root.codegenNode
  //希望在 root 节点中实现属性
  createRootCodegen(root);
  //将 helpers 赋值到根节点 root
  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: any) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}

function createTransformContext(root: any, options: any): any {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function traverseNode(node: any, context) {
  //修改 text content
  const nodeTransforms = context.nodeTransforms;
  const exitFns: any = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    const onExit = transform(node, context);
    if (onExit) {
      exitFns.push(onExit);
    }
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(node: any, context: any) {
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}
