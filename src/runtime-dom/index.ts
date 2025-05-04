import { createRenderer } from "../runtime-core";
const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
});
function createElement(type) {
  return document.createElement(type);
}
function patchProps(el, key, val) {
  //注册事件的时机--> 只有key的规范为 on + Event name 时才是一个注册事件
  //封装 isOn 函数
  const isOn = (key: string) => /^on[A -Z]/.test(key);
  if (isOn(key)) {
    // onClick -> click
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    el.setAttribute(key, val);
  }
}
function insert(el, parent) {
  parent.append(el);
}
export function createApp(...args) {
  return renderer.createApp(...args);
}
export * from "../runtime-core";
