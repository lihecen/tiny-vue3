import { render } from "./renderer";
import { createVNode } from "./vnode";
export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      //先转换成虚拟节点vnode，后续所有的逻辑操作
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer);
    },
  };
}
