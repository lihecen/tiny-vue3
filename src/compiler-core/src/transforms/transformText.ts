import { NodeTypes } from "../ast";
import { isText } from "../utils";
export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      //创建容器
      let currentContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          //搜索下一个节点
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                //初始化
                currentContainer = children[i] = {
                  //复合类型
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push(" + ");
              currentContainer.children.push(next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
