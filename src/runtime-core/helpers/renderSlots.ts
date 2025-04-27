import { createVNode } from "../vnode";
export function renderSlots(slots, name, props) {
  //vnode
  //获取需要渲染的 slot
  const slot = slots[name];
  if (slot) {
    //判断 slot 是否为 function 类型
    if (typeof slot === "function") {
      return createVNode("div", {}, slot(props));
    }
  }
}
