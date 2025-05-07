import { createRenderer } from "../runtime-core";
function createElement(type) {
  return document.createElement(type);
}
function patchProps(el, key, prevVal, nextVal) {
  //注册事件的时机--> 只有key的规范为 on + Event name 时才是一个注册事件
  //封装 isOn 函数
  const isOn = (key: string) => /^on[A -Z]/.test(key);
  if (isOn(key)) {
    // onClick -> click
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}
//anchor: 锚点，代表需要添加的位置
function insert(child, parent, anchor) {
  parent.insertBefore(child, anchor || null);
}

function remove(child) {
  if (child) {
    const parent = child.parentNode;
    //如果当前节点存在父节点，则把当前节点删除掉
    if (parent) {
      parent.removeChild(child);
    }
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
  remove,
  setElementText,
});
export function createApp(...args) {
  return renderer.createApp(...args);
}
export * from "../runtime-core";
